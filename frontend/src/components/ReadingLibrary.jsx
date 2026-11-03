import { useState, useEffect } from 'react';
import { apiRequest } from '../api';

const CATEGORIES = [
  'All',
  'Beginner English stories',
  'Short stories with simple vocabulary',
  'Moral stories',
  'English grammar',
  'Vocabulary building',
  'Daily-use English conversations',
  'Reading comprehension',
  'Intermediate English stories',
  'Advanced reading materials'
];

export default function ReadingLibrary({ user }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [alert, setAlert] = useState(null);

  // Active Reader View State
  const [readingBook, setReadingBook] = useState(null);
  const [fontSize, setFontSize] = useState(18); // Reader font size in px

  // Teacher: Add Book Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formAuthor, setFormAuthor] = useState('');
  const [formCategory, setFormCategory] = useState('Beginner English stories');
  const [formDifficulty, setFormDifficulty] = useState('Beginner');
  const [formSummary, setFormSummary] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formVocab, setFormVocab] = useState('');

  const isTeacher = user.role === 'admin';

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (selectedDifficulty !== 'All') params.append('difficulty', selectedDifficulty);
      if (searchQuery) params.append('search', searchQuery);

      const data = await apiRequest(`/library?${params.toString()}`);
      setBooks(data.books || []);
    } catch (err) {
      setAlert({ type: 'danger', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [selectedCategory, selectedDifficulty]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchBooks();
  };

  const handleOpenReader = async (bookId) => {
    try {
      const data = await apiRequest(`/library/${bookId}`);
      setReadingBook(data.book);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setAlert({ type: 'danger', message: err.message });
    }
  };

  const handleAddBookSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/library', {
        method: 'POST',
        body: JSON.stringify({
          title: formTitle,
          author: formAuthor,
          category: formCategory,
          difficulty: formDifficulty,
          summary: formSummary,
          content: formContent,
          vocabulary_notes: formVocab
        })
      });
      setAlert({ type: 'success', message: 'Book added to the English library!' });
      setShowAddModal(false);
      setFormTitle('');
      setFormAuthor('');
      setFormSummary('');
      setFormContent('');
      setFormVocab('');
      fetchBooks();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message });
    }
  };

  const handleDeleteBook = async (bookId, title) => {
    if (!window.confirm(`Delete "${title}" from the library?`)) return;
    try {
      await apiRequest(`/library/${bookId}`, { method: 'DELETE' });
      setAlert({ type: 'warning', message: 'Book deleted from library.' });
      if (readingBook?.id === bookId) setReadingBook(null);
      fetchBooks();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message });
    }
  };

  // Render Fullscreen Comfortable Reader Interface
  if (readingBook) {
    return (
      <div className="container py-4">
        <div className="card shadow border-0 rounded-4 overflow-hidden bg-white">
          {/* Reader Header / Controls */}
          <div className="card-header bg-light py-3 px-4 d-flex flex-wrap justify-content-between align-items-center gap-2 border-bottom">
            <button className="btn btn-outline-secondary btn-sm" onClick={() => setReadingBook(null)}>
              <i className="bi bi-arrow-left me-1"></i> Back to Library
            </button>

            {/* Font Size Adjusters */}
            <div className="d-flex align-items-center gap-2">
              <small className="text-muted fw-semibold">Text Size:</small>
              <button
                className="btn btn-sm btn-outline-secondary py-0 px-2"
                onClick={() => setFontSize(prev => Math.max(prev - 2, 14))}
                title="Decrease font size"
              >
                A-
              </button>
              <button
                className="btn btn-sm btn-outline-secondary py-0 px-2"
                onClick={() => setFontSize(prev => Math.min(prev + 2, 28))}
                title="Increase font size"
              >
                A+
              </button>
            </div>
          </div>

          <div className="card-body p-4 p-md-5">
            <div className="row g-4">
              {/* Reading Content Area */}
              <div className="col-lg-8">
                <span className="badge bg-primary bg-opacity-10 text-primary mb-2">
                  {readingBook.category} &bull; {readingBook.difficulty}
                </span>
                <h1 className="fw-bold text-dark mb-1">{readingBook.title}</h1>
                <p className="text-muted mb-4">By {readingBook.author}</p>

                <div
                  className="p-4 bg-light bg-opacity-50 rounded-4 border text-dark"
                  style={{
                    fontSize: `${fontSize}px`,
                    lineHeight: 1.85,
                    whiteSpace: 'pre-line',
                    fontFamily: 'Georgia, serif'
                  }}
                >
                  {readingBook.content}
                </div>
              </div>

              {/* Sidebar: Vocabulary Notes */}
              <div className="col-lg-4">
                <div className="card border-0 shadow-sm rounded-4 bg-warning bg-opacity-10 p-4 sticky-top" style={{ top: '80px' }}>
                  <h5 className="fw-bold text-dark mb-3">
                    <i className="bi bi-lightbulb-fill text-warning me-2"></i>
                    Vocabulary Builder
                  </h5>
                  <p className="small text-muted mb-3">
                    Learn these key English words and phrases from this story:
                  </p>
                  {readingBook.vocabulary_notes ? (
                    <div className="small text-dark" style={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}>
                      {readingBook.vocabulary_notes}
                    </div>
                  ) : (
                    <p className="small text-muted fst-italic">No vocabulary notes added for this text.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-bold mb-1 text-primary">
            <i className="bi bi-book-half me-2"></i>English Reading Library
          </h2>
          <p className="text-muted mb-0">
            Expand your vocabulary, practice comprehension, and read classic moral stories and conversations
          </p>
        </div>
        {isTeacher && (
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <i className="bi bi-plus-circle me-1"></i> Add Reading Material
          </button>
        )}
      </div>

      {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show`} role="alert">
          {alert.message}
          <button type="button" className="btn-close" onClick={() => setAlert(null)}></button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card shadow-sm border-0 rounded-4 p-3 mb-4 bg-white">
        <form onSubmit={handleSearchSubmit} className="row g-2 align-items-center">
          {/* Category Filter */}
          <div className="col-md-4">
            <label className="form-label small fw-semibold text-muted mb-1">Category</label>
            <select
              className="form-select form-select-sm"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Difficulty Filter */}
          <div className="col-md-3">
            <label className="form-label small fw-semibold text-muted mb-1">Difficulty Level</label>
            <select
              className="form-select form-select-sm"
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
            >
              <option value="All">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="col-md-5">
            <label className="form-label small fw-semibold text-muted mb-1">Search Story or Topic</label>
            <div className="input-group input-group-sm">
              <input
                type="text"
                className="form-control"
                placeholder="Search title, author, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">
                <i className="bi bi-search me-1"></i> Search
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Books Grid */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : books.length === 0 ? (
        <div className="card shadow-sm border-0 text-center py-5 rounded-4">
          <i className="bi bi-journal-x display-3 text-muted mb-3"></i>
          <h5>No Reading Materials Found</h5>
          <p className="text-muted">Try choosing a different category or search term.</p>
        </div>
      ) : (
        <div className="row g-4">
          {books.map(book => (
            <div key={book.id} className="col-md-6 col-lg-4">
              <div className="card h-100 shadow-sm border-0 rounded-4 overflow-hidden border-top border-4 border-info">
                <div className="card-body p-4 d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className={`badge ${
                      book.difficulty === 'Beginner' ? 'bg-success' :
                      book.difficulty === 'Intermediate' ? 'bg-primary' : 'bg-danger'
                    }`}>
                      {book.difficulty}
                    </span>
                    <small className="text-muted">{book.category}</small>
                  </div>

                  <h5 className="fw-bold text-dark mb-1">{book.title}</h5>
                  <p className="text-muted small mb-2">By {book.author}</p>

                  <p className="text-secondary small flex-grow-1" style={{ lineHeight: 1.6 }}>
                    {book.summary || 'A rich reading passage for improving English vocabulary and comprehension.'}
                  </p>

                  <div className="pt-3 border-top mt-auto d-flex justify-content-between align-items-center">
                    <button
                      className="btn btn-info btn-sm text-white fw-semibold"
                      onClick={() => handleOpenReader(book.id)}
                    >
                      <i className="bi bi-book-reader me-1"></i> Read Story
                    </button>
                    {isTeacher && (
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleDeleteBook(book.id, book.title)}
                        title="Delete Book"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Teacher: Add Book Modal */}
      {showAddModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 rounded-4 shadow">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-book-plus me-2"></i>Add Reading Material to Library
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowAddModal(false)}></button>
              </div>
              <form onSubmit={handleAddBookSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3 mb-3">
                    <div className="col-md-7">
                      <label className="form-label fw-semibold">Title</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. The Fox and the Grapes"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-5">
                      <label className="form-label fw-semibold">Author / Source</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Aesop"
                        value={formAuthor}
                        onChange={(e) => setFormAuthor(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Category</label>
                      <select
                        className="form-select"
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                      >
                        {CATEGORIES.filter(c => c !== 'All').map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Difficulty Level</label>
                      <select
                        className="form-select"
                        value={formDifficulty}
                        onChange={(e) => setFormDifficulty(e.target.value)}
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Short Summary</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Brief one-sentence summary for the catalog card"
                      value={formSummary}
                      onChange={(e) => setFormSummary(e.target.value)}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Full Story / Reading Content</label>
                    <textarea
                      className="form-control"
                      rows={6}
                      placeholder="Paste the English reading text, story paragraphs, or grammar explanation here..."
                      value={formContent}
                      onChange={(e) => setFormContent(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Vocabulary Notes (Word Meanings & Grammar Tips)</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="e.g. • Perseverance: Persistence in doing something despite difficulty."
                      value={formVocab}
                      onChange={(e) => setFormVocab(e.target.value)}
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary fw-semibold">Add to Library</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
