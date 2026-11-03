import { useState, useEffect } from 'react';
import { apiRequest } from '../api';

export default function ClassList({ user, onEnterClassroom }) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedClassAttendance, setSelectedClassAttendance] = useState([]);
  const [selectedClassTitle, setSelectedClassTitle] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduled_at: ''
  });
  const [alert, setAlert] = useState(null);

  const isTeacher = user.role === 'admin';

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/classes');
      setClasses(data.classes || []);
    } catch (err) {
      setAlert({ type: 'danger', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/classes', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setAlert({ type: 'success', message: 'Class scheduled successfully!' });
      setShowScheduleModal(false);
      setFormData({ title: '', description: '', scheduled_at: '' });
      fetchClasses();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message });
    }
  };

  const handleStartClass = async (cls) => {
    try {
      if (cls.status !== 'live') {
        await apiRequest(`/classes/${cls.id}/status`, {
          method: 'POST',
          body: JSON.stringify({ status: 'live' })
        });
      }
      onEnterClassroom(cls);
    } catch (err) {
      setAlert({ type: 'danger', message: err.message });
    }
  };

  const handleJoinClass = async (cls) => {
    try {
      await apiRequest(`/classes/${cls.id}/join`, { method: 'POST' });
      onEnterClassroom(cls);
    } catch (err) {
      setAlert({ type: 'danger', message: err.message });
    }
  };

  const handleEndClass = async (clsId) => {
    if (!window.confirm('Mark this class as completed?')) return;
    try {
      await apiRequest(`/classes/${clsId}/status`, {
        method: 'POST',
        body: JSON.stringify({ status: 'completed' })
      });
      setAlert({ type: 'info', message: 'Class marked as completed.' });
      fetchClasses();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message });
    }
  };

  const handleViewAttendance = async (cls) => {
    try {
      setSelectedClassTitle(cls.title);
      const data = await apiRequest(`/classes/${cls.id}/attendance`);
      setSelectedClassAttendance(data.attendance || []);
      setShowAttendanceModal(true);
    } catch (err) {
      setAlert({ type: 'danger', message: err.message });
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-bold mb-1 text-primary">
            <i className="bi bi-camera-video-fill me-2"></i>Live English Classes
          </h2>
          <p className="text-muted mb-0">Join video sessions and collaborate on the interactive whiteboard</p>
        </div>
        {isTeacher && (
          <button
            className="btn btn-primary"
            onClick={() => setShowScheduleModal(true)}
          >
            <i className="bi bi-plus-circle me-1"></i> Schedule New Class
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
      ) : classes.length === 0 ? (
        <div className="card shadow-sm border-0 text-center py-5 rounded-4">
          <i className="bi bi-calendar-x display-3 text-muted mb-3"></i>
          <h5>No Classes Scheduled Yet</h5>
          <p className="text-muted">
            {isTeacher
              ? 'Click "Schedule New Class" above to create your first English class.'
              : 'Your teacher has not scheduled any classes yet. Check back soon!'}
          </p>
        </div>
      ) : (
        <div className="row g-3">
          {classes.map(cls => (
            <div key={cls.id} className="col-md-6 col-lg-4">
              <div className={`card h-100 shadow-sm border-0 rounded-4 overflow-hidden border-top border-4 ${
                cls.status === 'live' ? 'border-danger' : cls.status === 'completed' ? 'border-secondary' : 'border-primary'
              }`}>
                <div className="card-body p-4 d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className={`badge ${
                      cls.status === 'live' ? 'bg-danger text-white' :
                      cls.status === 'completed' ? 'bg-secondary' : 'bg-primary'
                    }`}>
                      {cls.status === 'live' ? '🔴 LIVE NOW' : cls.status.toUpperCase()}
                    </span>
                    <small className="text-muted">
                      <i className="bi bi-clock me-1"></i>{cls.scheduled_at}
                    </small>
                  </div>

                  <h5 className="fw-bold mb-2 text-dark">{cls.title}</h5>
                  <p className="text-muted small flex-grow-1">
                    {cls.description || 'No additional instructions provided for this class.'}
                  </p>

                  <div className="pt-3 border-top mt-auto">
                    {isTeacher ? (
                      <div className="d-flex flex-wrap gap-2">
                        {cls.status !== 'completed' && (
                          <button
                            className="btn btn-success btn-sm flex-grow-1"
                            onClick={() => handleStartClass(cls)}
                          >
                            <i className="bi bi-camera-video me-1"></i> {cls.status === 'live' ? 'Re-enter Class' : 'Start Class'}
                          </button>
                        )}
                        {cls.status === 'live' && (
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleEndClass(cls.id)}
                            title="End Class"
                          >
                            <i className="bi bi-stop-circle"></i> End
                          </button>
                        )}
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => handleViewAttendance(cls)}
                          title="View Attendance"
                        >
                          <i className="bi bi-people-fill me-1"></i> Attendance
                        </button>
                      </div>
                    ) : (
                      cls.status === 'live' ? (
                        <button
                          className="btn btn-danger w-100 fw-bold"
                          onClick={() => handleJoinClass(cls)}
                        >
                          <i className="bi bi-play-circle-fill me-1"></i> Join Class Now (Attendance Logged)
                        </button>
                      ) : cls.status === 'upcoming' ? (
                        <button
                          className="btn btn-outline-primary w-100"
                          onClick={() => handleJoinClass(cls)}
                        >
                          <i className="bi bi-box-arrow-in-right me-1"></i> Enter Waiting Room
                        </button>
                      ) : (
                        <button className="btn btn-secondary w-100 btn-sm" disabled>
                          <i className="bi bi-check-circle me-1"></i> Class Completed
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule Class Modal */}
      {showScheduleModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-calendar-plus me-2"></i>Schedule English Class
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowScheduleModal(false)}></button>
              </div>
              <form onSubmit={handleScheduleSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Class Title / Topic</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Tenses: Present Continuous & Past Simple"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Date & Time</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      value={formData.scheduled_at}
                      onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Description / Notes for Students</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="e.g. Please bring your grammar workbook page 42."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowScheduleModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary fw-semibold">Save & Publish Class</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Modal */}
      {showAttendanceModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 rounded-4 shadow">
              <div className="modal-header bg-light">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-clipboard-check text-primary me-2"></i>
                  Attendance: {selectedClassTitle}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowAttendanceModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                {selectedClassAttendance.length === 0 ? (
                  <p className="text-muted text-center py-4 mb-0">No students have joined this class yet.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Student Name</th>
                          <th>Email</th>
                          <th>Joined Timestamp</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedClassAttendance.map((record, idx) => (
                          <tr key={idx}>
                            <td className="fw-semibold">{record.name}</td>
                            <td>{record.email}</td>
                            <td className="text-muted small">{record.marked_at}</td>
                            <td><span className="badge bg-success">PRESENT</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAttendanceModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
