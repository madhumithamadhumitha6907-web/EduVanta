import { useState, useEffect } from 'react';
import { apiRequest } from '../api';

const API_BASE = 'http://127.0.0.1:5000';

export default function Assignments({ user }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionsList, setSubmissionsList] = useState([]);
  const [alert, setAlert] = useState(null);

  // Form states for creating assignment
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [totalMarks, setTotalMarks] = useState(100);
  const [dueDate, setDueDate] = useState('');
  const [assignmentFile, setAssignmentFile] = useState(null);

  // File upload state for student submission
  const [selectedStudentFiles, setSelectedStudentFiles] = useState({});
  const [submittingId, setSubmittingId] = useState(null);

  // Grading state for teacher
  const [grades, setGrades] = useState({});
  const [feedbacks, setFeedbacks] = useState({});

  const isTeacher = user.role === 'admin';

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/assignments');
      setAssignments(data.assignments || []);
    } catch (err) {
      setAlert({ type: 'danger', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('instructions', instructions);
      formData.append('total_marks', totalMarks);
      formData.append('due_date', dueDate);
      if (assignmentFile) {
        formData.append('file', assignmentFile);
      }

      const token = localStorage.getItem('tuition_token');
      const res = await fetch(`${API_BASE}/api/assignments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create assignment');

      setAlert({ type: 'success', message: 'Assignment created successfully!' });
      setShowCreateModal(false);
      setTitle('');
      setInstructions('');
      setAssignmentFile(null);
      fetchAssignments();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message });
    }
  };

  const handleDeleteAssignment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;
    try {
      await apiRequest(`/assignments/${id}`, { method: 'DELETE' });
      setAlert({ type: 'warning', message: 'Assignment deleted.' });
      fetchAssignments();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message });
    }
  };

  const handleOpenSubmissions = async (assignment) => {
    try {
      setSelectedAssignment(assignment);
      const data = await apiRequest(`/assignments/${assignment.id}/submissions`);
      setSubmissionsList(data.submissions || []);
      
      // Initialize grading inputs with existing values
      const initialGrades = {};
      const initialFeedbacks = {};
      (data.submissions || []).forEach(sub => {
        initialGrades[sub.id] = sub.marks_awarded ?? '';
        initialFeedbacks[sub.id] = sub.feedback ?? '';
      });
      setGrades(initialGrades);
      setFeedbacks(initialFeedbacks);

      setShowSubmissionsModal(true);
    } catch (err) {
      setAlert({ type: 'danger', message: err.message });
    }
  };

  const handleSaveGrade = async (submissionId) => {
    try {
      await apiRequest(`/submissions/${submissionId}/grade`, {
        method: 'POST',
        body: JSON.stringify({
          marks_awarded: grades[submissionId],
          feedback: feedbacks[submissionId]
        })
      });
      setAlert({ type: 'success', message: 'Marks and feedback saved!' });
      // Refresh submissions
      const data = await apiRequest(`/assignments/${selectedAssignment.id}/submissions`);
      setSubmissionsList(data.submissions || []);
    } catch (err) {
      setAlert({ type: 'danger', message: err.message });
    }
  };

  const handleStudentSubmit = async (assignmentId) => {
    const file = selectedStudentFiles[assignmentId];
    if (!file) {
      alert('Please select a file to submit.');
      return;
    }

    try {
      setSubmittingId(assignmentId);
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('tuition_token');
      const res = await fetch(`${API_BASE}/api/assignments/${assignmentId}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');

      setAlert({ type: 'success', message: 'Homework submitted successfully!' });
      fetchAssignments();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message });
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-bold mb-1 text-primary">
            <i className="bi bi-journal-check me-2"></i>Daily Assignments & Homework
          </h2>
          <p className="text-muted mb-0">
            {isTeacher
              ? 'Post daily worksheets, review student submissions, and assign grades.'
              : 'Complete your daily English assignments, upload worksheets, and track teacher feedback.'}
          </p>
        </div>
        {isTeacher && (
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <i className="bi bi-plus-circle me-1"></i> Create Assignment
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
      ) : assignments.length === 0 ? (
        <div className="card shadow-sm border-0 text-center py-5 rounded-4">
          <i className="bi bi-journal-x display-3 text-muted mb-3"></i>
          <h5>No Assignments Posted Yet</h5>
          <p className="text-muted">
            {isTeacher
              ? 'Click "Create Assignment" to post the first homework worksheet.'
              : 'No homework has been assigned yet. Check back soon!'}
          </p>
        </div>
      ) : (
        <div className="row g-4">
          {assignments.map(item => (
            <div key={item.id} className="col-12">
              <div className="card shadow-sm border-0 rounded-4 overflow-hidden border-start border-primary border-4">
                <div className="card-body p-4">
                  <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
                    <div>
                      <h4 className="fw-bold text-dark mb-1">{item.title}</h4>
                      <div className="text-muted small">
                        <i className="bi bi-calendar-event me-1 text-primary"></i>
                        <strong>Due Date:</strong> {item.due_date} &bull; 
                        <i className="bi bi-award me-1 ms-2 text-warning"></i>
                        <strong>Total Marks:</strong> {item.total_marks}
                      </div>
                    </div>

                    {isTeacher ? (
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-outline-primary btn-sm position-relative"
                          onClick={() => handleOpenSubmissions(item)}
                        >
                          <i className="bi bi-inbox-fill me-1"></i> Review Submissions
                          <span className="badge bg-primary ms-1">{item.submissions_count || 0}</span>
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleDeleteAssignment(item.id)}
                          title="Delete"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    ) : (
                      /* Student Status Badge */
                      <div>
                        {item.submission_status === 'graded' ? (
                          <span className="badge bg-success fs-6 p-2">
                            <i className="bi bi-patch-check-fill me-1"></i> GRADED: {item.marks_awarded} / {item.total_marks}
                          </span>
                        ) : item.submission_status === 'submitted' ? (
                          <span className="badge bg-warning text-dark fs-6 p-2">
                            <i className="bi bi-hourglass-split me-1"></i> SUBMITTED (Awaiting Teacher Feedback)
                          </span>
                        ) : (
                          <span className="badge bg-danger fs-6 p-2">
                            <i className="bi bi-exclamation-circle-fill me-1"></i> PENDING SUBMISSION
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Instructions */}
                  <div className="p-3 bg-light rounded-3 my-3">
                    <h6 className="fw-semibold text-secondary mb-1">
                      <i className="bi bi-card-text me-1"></i> Instructions:
                    </h6>
                    <p className="mb-0 text-dark" style={{ whiteSpace: 'pre-line' }}>{item.instructions}</p>
                  </div>

                  {/* Attachment if teacher provided one */}
                  {item.attachment_url && (
                    <div className="mb-3">
                      <a
                        href={`${API_BASE}${item.attachment_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-outline-secondary"
                      >
                        <i className="bi bi-paperclip me-1"></i> Download Teacher Worksheet / Material
                      </a>
                    </div>
                  )}

                  {/* Student Submission Controls and Corrections */}
                  {!isTeacher && (
                    <div className="pt-3 border-top mt-3">
                      {item.submission_status === 'graded' && (
                        <div className="alert alert-success d-flex align-items-start mb-3">
                          <i className="bi bi-chat-left-quote-fill fs-4 me-3 mt-1"></i>
                          <div>
                            <strong>Teacher's Feedback & Corrections:</strong>
                            <div className="mt-1">{item.feedback || 'Excellent work!'}</div>
                            <div className="mt-2 small text-muted">
                              Submitted: {item.submitted_at} &bull; <a href={`${API_BASE}${item.submission_file}`} target="_blank" rel="noreferrer">View Submitted File</a>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="row align-items-center g-2">
                        <div className="col-md-7">
                          <label className="form-label small fw-semibold text-muted mb-1">
                            {item.submission_status ? 'Upload a revised file:' : 'Upload your completed homework (PDF, PNG, JPG):'}
                          </label>
                          <input
                            type="file"
                            className="form-control form-control-sm"
                            accept=".pdf, .png, .jpg, .jpeg, .docx"
                            onChange={(e) => setSelectedStudentFiles({
                              ...selectedStudentFiles,
                              [item.id]: e.target.files[0]
                            })}
                          />
                        </div>
                        <div className="col-md-5 text-md-end mt-3 mt-md-auto">
                          <button
                            className="btn btn-primary btn-sm px-4 fw-semibold"
                            onClick={() => handleStudentSubmit(item.id)}
                            disabled={submittingId === item.id}
                          >
                            <i className="bi bi-upload me-1"></i>
                            {submittingId === item.id ? 'Uploading...' : item.submission_status ? 'Resubmit Homework' : 'Submit Homework'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Teacher: Create Assignment Modal */}
      {showCreateModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 rounded-4 shadow">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-plus-circle me-2"></i>Create Daily Assignment
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowCreateModal(false)}></button>
              </div>
              <form onSubmit={handleCreateAssignment}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Assignment Title</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Daily Grammar Worksheet: Prepositions & Conjunctions"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Due Date & Time</label>
                      <input
                        type="datetime-local"
                        className="form-control"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Total Marks</label>
                      <input
                        type="number"
                        className="form-control"
                        value={totalMarks}
                        onChange={(e) => setTotalMarks(e.target.value)}
                        required
                        min={1}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Instructions & Questions</label>
                    <textarea
                      className="form-control"
                      rows={5}
                      placeholder="Write your homework questions, guidelines, or essay prompts here..."
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Attach Worksheet / File (Optional)</label>
                    <input
                      type="file"
                      className="form-control"
                      accept=".pdf, .png, .jpg, .jpeg, .docx"
                      onChange={(e) => setAssignmentFile(e.target.files[0])}
                    />
                    <small className="text-muted">Accepted formats: PDF, Images, Word Documents (up to 16MB)</small>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary fw-semibold">Publish Assignment</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Teacher: Review Submissions Modal */}
      {showSubmissionsModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-xl">
            <div className="modal-content border-0 rounded-4 shadow">
              <div className="modal-header bg-light">
                <div>
                  <h5 className="modal-title fw-bold text-dark mb-0">
                    <i className="bi bi-inbox-fill text-primary me-2"></i>
                    Student Submissions: {selectedAssignment?.title}
                  </h5>
                  <small className="text-muted">Total Marks: {selectedAssignment?.total_marks}</small>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowSubmissionsModal(false)}></button>
              </div>

              <div className="modal-body p-4">
                {submissionsList.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <i className="bi bi-clock-history fs-2 text-warning d-block mb-2"></i>
                    No students have submitted this assignment yet.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Student</th>
                          <th>Submitted On</th>
                          <th>Submitted File</th>
                          <th style={{ width: '130px' }}>Marks Awarded</th>
                          <th>Teacher Feedback</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {submissionsList.map(sub => (
                          <tr key={sub.id}>
                            <td>
                              <div className="fw-semibold">{sub.student_name}</div>
                              <small className="text-muted">{sub.student_email}</small>
                            </td>
                            <td className="small text-muted">{sub.submitted_at}</td>
                            <td>
                              <a
                                href={`${API_BASE}${sub.file_url}`}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-sm btn-outline-primary"
                              >
                                <i className="bi bi-download me-1"></i> View Work
                              </a>
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                placeholder={`/ ${selectedAssignment.total_marks}`}
                                value={grades[sub.id] ?? ''}
                                onChange={(e) => setGrades({ ...grades, [sub.id]: e.target.value })}
                                max={selectedAssignment.total_marks}
                                min={0}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="e.g. Good grammar, watch out for verb tenses in Q2"
                                value={feedbacks[sub.id] ?? ''}
                                onChange={(e) => setFeedbacks({ ...feedbacks, [sub.id]: e.target.value })}
                              />
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => handleSaveGrade(sub.id)}
                              >
                                <i className="bi bi-check-circle me-1"></i> Save
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowSubmissionsModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
