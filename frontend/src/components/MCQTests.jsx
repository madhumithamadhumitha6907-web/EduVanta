import { useState, useEffect } from 'react';
import { apiRequest } from '../api';

export default function MCQTests({ user }) {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Teacher Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [questionsList, setQuestionsList] = useState([]);
  const [resultsList, setResultsList] = useState([]);

  // Create Test Form
  const [testTitle, setTestTitle] = useState('');
  const [testDesc, setTestDesc] = useState('');
  const [duration, setDuration] = useState(30);

  // Add Question Form
  const [questionText, setQuestionText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctOpt, setCorrectOpt] = useState('A');
  const [marks, setMarks] = useState(1);

  // Student Test Taking State
  const [activeTakingTest, setActiveTakingTest] = useState(null);
  const [testQuestions, setTestQuestions] = useState([]);
  const [studentAnswers, setStudentAnswers] = useState({});
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  const isTeacher = user.role === 'admin';

  const fetchTests = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/tests');
      setTests(data.tests || []);
    } catch (err) {
      setAlert({ type: 'danger', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  // Timer countdown when student is taking a test
  useEffect(() => {
    if (!activeTakingTest || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeTakingTest, timeLeft]);

  const handleCreateTest = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/tests', {
        method: 'POST',
        body: JSON.stringify({
          title: testTitle,
          description: testDesc,
          duration_minutes: duration
        })
      });
      setAlert({ type: 'success', message: 'Test created successfully! Click "Questions" to add questions.' });
      setShowCreateModal(false);
      setTestTitle('');
      setTestDesc('');
      fetchTests();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message });
    }
  };

  const handleTogglePublish = async (testId) => {
    try {
      const data = await apiRequest(`/tests/${testId}/toggle-publish`, { method: 'POST' });
      setAlert({ type: 'info', message: data.message });
      fetchTests();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message });
    }
  };

  const handleToggleResults = async (testId) => {
    try {
      const data = await apiRequest(`/tests/${testId}/toggle-results`, { method: 'POST' });
      setAlert({ type: 'info', message: data.message });
      fetchTests();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message });
    }
  };

  const handleOpenQuestions = async (test) => {
    try {
      setSelectedTest(test);
      const data = await apiRequest(`/tests/${test.id}/questions`);
      setQuestionsList(data.questions || []);
      setShowQuestionsModal(true);
    } catch (err) {
      setAlert({ type: 'danger', message: err.message });
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    try {
      await apiRequest(`/tests/${selectedTest.id}/questions`, {
        method: 'POST',
        body: JSON.stringify({
          question_text: questionText,
          option_a: optA,
          option_b: optB,
          option_c: optC,
          option_d: optD,
          correct_option: correctOpt,
          marks: marks
        })
      });
      setQuestionText('');
      setOptA('');
      setOptB('');
      setOptC('');
      setOptD('');
      setCorrectOpt('A');
      // Refresh questions list
      const data = await apiRequest(`/tests/${selectedTest.id}/questions`);
      setQuestionsList(data.questions || []);
      fetchTests();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message });
    }
  };

  const handleDeleteQuestion = async (qId) => {
    try {
      await apiRequest(`/questions/${qId}`, { method: 'DELETE' });
      const data = await apiRequest(`/tests/${selectedTest.id}/questions`);
      setQuestionsList(data.questions || []);
      fetchTests();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message });
    }
  };

  const handleOpenResults = async (test) => {
    try {
      setSelectedTest(test);
      const data = await apiRequest(`/tests/${test.id}/results`);
      setResultsList(data.results || []);
      setShowResultsModal(true);
    } catch (err) {
      setAlert({ type: 'danger', message: err.message });
    }
  };

  const handleDeleteTest = async (testId) => {
    if (!window.confirm('Are you sure you want to delete this test?')) return;
    try {
      await apiRequest(`/tests/${testId}`, { method: 'DELETE' });
      setAlert({ type: 'warning', message: 'Test deleted.' });
      fetchTests();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message });
    }
  };

  // Student Test Taking Handlers
  const handleStartTest = async (test) => {
    try {
      const data = await apiRequest(`/tests/${test.id}/questions`);
      if (!data.questions || data.questions.length === 0) {
        alert('This test has no questions added yet. Please contact the teacher.');
        return;
      }
      setSelectedTest(test);
      setTestQuestions(data.questions);
      setStudentAnswers({});
      setCurrentQIndex(0);
      setTimeLeft(test.duration_minutes * 60);
      setActiveTakingTest(test);
    } catch (err) {
      setAlert({ type: 'danger', message: err.message });
    }
  };

  const handleAutoSubmit = () => {
    alert('Time is up! Submitting your answers automatically...');
    handleSubmitTest();
  };

  const handleSubmitTest = async () => {
    if (!window.confirm('Are you ready to submit your test?')) return;
    try {
      const data = await apiRequest(`/tests/${activeTakingTest.id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers: studentAnswers })
      });
      alert(data.message);
      setActiveTakingTest(null);
      fetchTests();
    } catch (err) {
      alert(err.message);
    }
  };

  // Render Taking Test Interface for Student
  if (activeTakingTest && testQuestions.length > 0) {
    const currentQ = testQuestions[currentQIndex];
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
      <div className="container py-4">
        <div className="card shadow border-0 rounded-4 overflow-hidden">
          {/* Header & Timer */}
          <div className="card-header bg-primary text-white py-3 px-4 d-flex justify-content-between align-items-center">
            <div>
              <h5 className="fw-bold mb-0">{activeTakingTest.title}</h5>
              <small className="text-white-50">Online English Quiz</small>
            </div>
            <div className="badge bg-danger fs-6 px-3 py-2 rounded-pill">
              <i className="bi bi-clock-history me-1"></i>
              {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
            </div>
          </div>

          <div className="card-body p-4 p-md-5">
            {/* Progress Bar */}
            <div className="d-flex justify-content-between small text-muted mb-2">
              <span>Question {currentQIndex + 1} of {testQuestions.length}</span>
              <span>Marks: {currentQ.marks}</span>
            </div>
            <div className="progress mb-4" style={{ height: '8px' }}>
              <div
                className="progress-bar bg-primary"
                style={{ width: `${((currentQIndex + 1) / testQuestions.length) * 100}%` }}
              ></div>
            </div>

            {/* Question Text */}
            <h4 className="fw-bold text-dark mb-4">
              {currentQIndex + 1}. {currentQ.question_text}
            </h4>

            {/* Answer Options */}
            <div className="row g-3 mb-4">
              {[
                { label: 'A', text: currentQ.option_a },
                { label: 'B', text: currentQ.option_b },
                { label: 'C', text: currentQ.option_c },
                { label: 'D', text: currentQ.option_d }
              ].map(opt => {
                const isSelected = studentAnswers[currentQ.id] === opt.label;
                return (
                  <div key={opt.label} className="col-12">
                    <div
                      className={`p-3 border rounded-3 cursor-pointer d-flex align-items-center ${
                        isSelected ? 'border-primary bg-primary bg-opacity-10 shadow-sm' : 'bg-white'
                      }`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setStudentAnswers({ ...studentAnswers, [currentQ.id]: opt.label })}
                    >
                      <span className={`badge me-3 fs-6 ${isSelected ? 'bg-primary text-white' : 'bg-light text-dark border'}`}>
                        {opt.label}
                      </span>
                      <span className="fs-5">{opt.text}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Navigation Buttons */}
            <div className="d-flex justify-content-between pt-3 border-top">
              <button
                className="btn btn-outline-secondary"
                disabled={currentQIndex === 0}
                onClick={() => setCurrentQIndex(prev => prev - 1)}
              >
                <i className="bi bi-arrow-left me-1"></i> Previous
              </button>

              {currentQIndex < testQuestions.length - 1 ? (
                <button
                  className="btn btn-primary px-4"
                  onClick={() => setCurrentQIndex(prev => prev + 1)}
                >
                  Next <i className="bi bi-arrow-right ms-1"></i>
                </button>
              ) : (
                <button className="btn btn-success px-4 fw-bold" onClick={handleSubmitTest}>
                  <i className="bi bi-check-circle-fill me-1"></i> Submit Test
                </button>
              )}
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
            <i className="bi bi-ui-checks-grid me-2"></i>Weekly English MCQ Tests
          </h2>
          <p className="text-muted mb-0">
            {isTeacher
              ? 'Create timed weekly tests, manage multiple choice questions, and publish ranks.'
              : 'Take weekly timed tests to evaluate your English grammar, vocabulary, and reading skills.'}
          </p>
        </div>
        {isTeacher && (
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <i className="bi bi-plus-circle me-1"></i> Create Weekly Test
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
      ) : tests.length === 0 ? (
        <div className="card shadow-sm border-0 text-center py-5 rounded-4">
          <i className="bi bi-file-earmark-check display-3 text-muted mb-3"></i>
          <h5>No Tests Available Yet</h5>
          <p className="text-muted">
            {isTeacher
              ? 'Click "Create Weekly Test" to add your first quiz.'
              : 'Your teacher has not published any tests yet. Check back soon!'}
          </p>
        </div>
      ) : (
        <div className="row g-4">
          {tests.map(test => (
            <div key={test.id} className="col-md-6 col-lg-4">
              <div className="card h-100 shadow-sm border-0 rounded-4 overflow-hidden border-top border-4 border-danger">
                <div className="card-body p-4 d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="badge bg-danger bg-opacity-10 text-danger border border-danger">
                      <i className="bi bi-stopwatch me-1"></i> {test.duration_minutes} Mins
                    </span>
                    <span className="badge bg-secondary">
                      {test.question_count || 0} Questions
                    </span>
                  </div>

                  <h5 className="fw-bold text-dark mb-1">{test.title}</h5>
                  <p className="text-muted small flex-grow-1">
                    {test.description || 'Weekly English multiple choice assessment.'}
                  </p>

                  <div className="pt-3 border-top mt-auto">
                    {isTeacher ? (
                      /* Teacher Controls */
                      <div className="d-flex flex-column gap-2">
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-outline-primary flex-grow-1"
                            onClick={() => handleOpenQuestions(test)}
                          >
                            <i className="bi bi-list-check me-1"></i> Questions ({test.question_count || 0})
                          </button>
                          <button
                            className="btn btn-sm btn-outline-success flex-grow-1"
                            onClick={() => handleOpenResults(test)}
                          >
                            <i className="bi bi-trophy me-1"></i> Scores ({test.submissions_count || 0})
                          </button>
                        </div>
                        <div className="d-flex gap-2">
                          <button
                            className={`btn btn-sm flex-grow-1 ${test.is_published ? 'btn-warning text-dark' : 'btn-outline-secondary'}`}
                            onClick={() => handleTogglePublish(test.id)}
                          >
                            {test.is_published ? 'Hide Test' : 'Publish for Students'}
                          </button>
                          <button
                            className={`btn btn-sm flex-grow-1 ${test.results_published ? 'btn-info text-white' : 'btn-outline-info'}`}
                            onClick={() => handleToggleResults(test.id)}
                          >
                            {test.results_published ? 'Scores Live' : 'Publish Scores'}
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteTest(test.id)}
                            title="Delete"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Student Controls */
                      <div>
                        {test.result_id ? (
                          <div className="text-center">
                            {test.results_published ? (
                              <div className="alert alert-success py-2 mb-0">
                                <i className="bi bi-award-fill fs-5 text-warning me-1"></i>
                                <strong>Score: {test.score} / {test.total_marks}</strong>
                              </div>
                            ) : (
                              <div className="alert alert-info py-2 mb-0 small">
                                <i className="bi bi-check2-circle me-1"></i>
                                Submitted! Results will be published soon.
                              </div>
                            )}
                          </div>
                        ) : (
                          <button
                            className="btn btn-danger w-100 fw-bold"
                            onClick={() => handleStartTest(test)}
                          >
                            <i className="bi bi-pencil-square me-1"></i> Take Test Online
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Teacher: Create Test Modal */}
      {showCreateModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-ui-checks me-2"></i>Create Weekly Test
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowCreateModal(false)}></button>
              </div>
              <form onSubmit={handleCreateTest}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Test Title</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Week 1: Tenses & Grammar Quiz"
                      value={testTitle}
                      onChange={(e) => setTestTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Duration (Minutes)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      required
                      min={5}
                      max={180}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Description / Topic Guidelines</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="e.g. 10 questions covering past, present, and future tenses."
                      value={testDesc}
                      onChange={(e) => setTestDesc(e.target.value)}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-danger fw-semibold">Create Test</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Teacher: Manage Questions Modal */}
      {showQuestionsModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-xl">
            <div className="modal-content border-0 rounded-4 shadow">
              <div className="modal-header bg-light">
                <h5 className="modal-title fw-bold text-dark">
                  <i className="bi bi-list-check text-primary me-2"></i>
                  Manage Questions: {selectedTest?.title}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowQuestionsModal(false)}></button>
              </div>

              <div className="modal-body p-4">
                {/* Form to Add Question */}
                <div className="card shadow-sm border p-3 mb-4 rounded-3 bg-light">
                  <h6 className="fw-bold mb-3 text-primary">
                    <i className="bi bi-plus-circle me-1"></i> Add New MCQ Question
                  </h6>
                  <form onSubmit={handleAddQuestion}>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Question Text</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Which of the following sentences uses the past continuous tense?"
                        value={questionText}
                        onChange={(e) => setQuestionText(e.target.value)}
                        required
                      />
                    </div>
                    <div className="row g-2 mb-3">
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold">Option A</label>
                        <input type="text" className="form-control form-control-sm" value={optA} onChange={(e) => setOptA(e.target.value)} required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold">Option B</label>
                        <input type="text" className="form-control form-control-sm" value={optB} onChange={(e) => setOptB(e.target.value)} required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold">Option C</label>
                        <input type="text" className="form-control form-control-sm" value={optC} onChange={(e) => setOptC(e.target.value)} required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold">Option D</label>
                        <input type="text" className="form-control form-control-sm" value={optD} onChange={(e) => setOptD(e.target.value)} required />
                      </div>
                    </div>
                    <div className="row g-2 align-items-end">
                      <div className="col-md-4">
                        <label className="form-label small fw-semibold">Correct Option</label>
                        <select className="form-select form-select-sm" value={correctOpt} onChange={(e) => setCorrectOpt(e.target.value)}>
                          <option value="A">Option A</option>
                          <option value="B">Option B</option>
                          <option value="C">Option C</option>
                          <option value="D">Option D</option>
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label small fw-semibold">Marks</label>
                        <input type="number" className="form-control form-control-sm" value={marks} onChange={(e) => setMarks(Number(e.target.value))} min={1} />
                      </div>
                      <div className="col-md-4">
                        <button type="submit" className="btn btn-primary btn-sm w-100 fw-semibold">
                          <i className="bi bi-plus-lg me-1"></i> Add Question
                        </button>
                      </div>
                    </div>
                  </form>
                </div>

                {/* Existing Questions List */}
                <h6 className="fw-bold mb-2">Existing Questions ({questionsList.length})</h6>
                {questionsList.length === 0 ? (
                  <p className="text-muted small">No questions added yet. Use the form above to add your first question.</p>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {questionsList.map((q, idx) => (
                      <div key={q.id} className="p-3 border rounded-3 bg-white d-flex justify-content-between align-items-start">
                        <div>
                          <div className="fw-semibold">
                            {idx + 1}. {q.question_text} <span className="badge bg-light text-dark ms-2">Marks: {q.marks}</span>
                          </div>
                          <div className="small text-muted mt-1">
                            A: {q.option_a} | B: {q.option_b} | C: {q.option_c} | D: {q.option_d}
                          </div>
                          <div className="small text-success fw-bold mt-1">
                            Correct Answer: Option {q.correct_option}
                          </div>
                        </div>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleDeleteQuestion(q.id)}
                          title="Delete"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowQuestionsModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Teacher: View Results Modal */}
      {showResultsModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 rounded-4 shadow">
              <div className="modal-header bg-light">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-trophy-fill text-warning me-2"></i>
                  Student Scores & Rankings: {selectedTest?.title}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowResultsModal(false)}></button>
              </div>

              <div className="modal-body p-4">
                {resultsList.length === 0 ? (
                  <div className="text-center py-4 text-muted">No students have taken this test yet.</div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Rank</th>
                          <th>Student Name</th>
                          <th>Score</th>
                          <th>Percentage</th>
                          <th>Submitted On</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resultsList.map((res, idx) => {
                          const pct = Math.round((res.score / res.total_marks) * 100);
                          return (
                            <tr key={res.id}>
                              <td>
                                <span className={`badge ${idx === 0 ? 'bg-warning text-dark' : idx === 1 ? 'bg-secondary' : idx === 2 ? 'bg-info text-dark' : 'bg-light text-dark'}`}>
                                  #{idx + 1}
                                </span>
                              </td>
                              <td className="fw-semibold">{res.student_name}</td>
                              <td>{res.score} / {res.total_marks}</td>
                              <td>
                                <span className={`badge ${pct >= 75 ? 'bg-success' : pct >= 50 ? 'bg-warning text-dark' : 'bg-danger'}`}>
                                  {pct}%
                                </span>
                              </td>
                              <td className="small text-muted">{res.submitted_at}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowResultsModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
