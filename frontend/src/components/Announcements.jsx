import { useState, useEffect } from 'react';
import { apiRequest } from '../api';

export default function Announcements({ user }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [alert, setAlert] = useState(null);

  const isTeacher = user.role === 'admin';

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/announcements');
      setAnnouncements(data.announcements || []);
    } catch (err) {
      setAlert({ type: 'danger', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/announcements', {
        method: 'POST',
        body: JSON.stringify({ title, content })
      });
      setAlert({ type: 'success', message: 'Announcement published to all students!' });
      setShowModal(false);
      setTitle('');
      setContent('');
      fetchAnnouncements();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await apiRequest(`/announcements/${id}`, { method: 'DELETE' });
      setAlert({ type: 'warning', message: 'Announcement deleted.' });
      fetchAnnouncements();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message });
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-bold mb-1 text-primary">
            <i className="bi bi-megaphone-fill me-2 text-primary"></i>Tuition Announcements & Updates
          </h2>
          <p className="text-muted mb-0">
            Important notices regarding live classes, homework deadlines, and test schedules
          </p>
        </div>
        {isTeacher && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <i className="bi bi-plus-circle me-1"></i> Post Announcement
          </button>
        )}
      </div>

      {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show`} role="alert">
          {alert.message}
          <button type="button" className="btn-close" onClick={() => setAlert(null)}></button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : announcements.length === 0 ? (
        <div className="card shadow-sm border-0 text-center py-5 rounded-4">
          <i className="bi bi-bell-slash display-3 text-muted mb-3"></i>
          <h5>No Announcements Yet</h5>
          <p className="text-muted">
            {isTeacher ? 'Click "Post Announcement" to broadcast a message to your students.' : 'All caught up! Check back later for teacher updates.'}
          </p>
        </div>
      ) : (
        <div className="row g-3">
          {announcements.map((item, idx) => (
            <div key={item.id} className="col-12">
              <div className="card shadow-sm border-0 rounded-4 overflow-hidden border-start border-4 border-warning bg-white">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-warning text-dark">
                        <i className="bi bi-pin-angle-fill me-1"></i> Notice #{announcements.length - idx}
                      </span>
                      <small className="text-muted">
                        <i className="bi bi-clock me-1"></i> {item.created_at}
                      </small>
                    </div>
                    {isTeacher && (
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(item.id)}
                        title="Delete Announcement"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    )}
                  </div>

                  <h5 className="fw-bold text-dark mb-2">{item.title}</h5>
                  <p className="mb-0 text-secondary" style={{ whiteSpace: 'pre-line', lineHeight: 1.7 }}>
                    {item.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post Announcement Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-megaphone me-2"></i>Post Class Announcement
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleCreate}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Title</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Tomorrow's Live Class Rescheduled to 6:00 PM"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Message Content</label>
                    <textarea
                      className="form-control"
                      rows={5}
                      placeholder="Write your announcement details, instructions, or meeting reminder here..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary fw-semibold">Publish Notice</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
