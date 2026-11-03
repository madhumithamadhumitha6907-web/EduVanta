import { useState, useEffect } from 'react';
import { apiRequest } from '../api';

export default function AdminDashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [overviewData, studentsData] = await Promise.all([
        apiRequest('/admin/overview'),
        apiRequest('/admin/students')
      ]);
      setStats(overviewData);
      setStudents(studentsData.students || []);
    } catch (err) {
      setAlert({ type: 'danger', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (studentId, newStatus) => {
    try {
      await apiRequest(`/admin/students/${studentId}/status`, {
        method: 'POST',
        body: JSON.stringify({ status: newStatus })
      });
      setAlert({ type: 'success', message: `Student status successfully changed to "${newStatus}".` });
      loadData();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message });
    }
  };

  const handleDelete = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to permanently delete student "${studentName}"?`)) return;
    try {
      await apiRequest(`/admin/students/${studentId}`, { method: 'DELETE' });
      setAlert({ type: 'warning', message: `Student "${studentName}" was removed.` });
      loadData();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message });
    }
  };

  const pendingStudents = students.filter(s => s.status === 'pending');

  return (
    <div className="container py-4">
      {/* Welcome Banner */}
      <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-bold mb-1 text-primary">
            <i className="bi bi-person-workspace me-2"></i>Teacher & Admin Dashboard
          </h2>
          <p className="text-muted mb-0">Welcome, {user.name} ({user.email})</p>
        </div>
        <button className="btn btn-outline-primary btn-sm" onClick={loadData}>
          <i className="bi bi-arrow-clockwise me-1"></i> Refresh Data
        </button>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show`} role="alert">
          {alert.message}
          <button type="button" className="btn-close" onClick={() => setAlert(null)}></button>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card shadow-sm border-0 border-start border-primary border-4 p-3 bg-white">
            <div className="text-muted small text-uppercase fw-bold">Active Students</div>
            <div className="h3 fw-bold mb-0 text-primary">{stats?.approved_students ?? 0}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm border-0 border-start border-warning border-4 p-3 bg-white">
            <div className="text-muted small text-uppercase fw-bold">Pending Approvals</div>
            <div className="h3 fw-bold mb-0 text-warning">{stats?.pending_students ?? 0}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm border-0 border-start border-success border-4 p-3 bg-white">
            <div className="text-muted small text-uppercase fw-bold">Total Classes</div>
            <div className="h3 fw-bold mb-0 text-success">{stats?.total_classes ?? 0}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm border-0 border-start border-info border-4 p-3 bg-white">
            <div className="text-muted small text-uppercase fw-bold">Assignments & Tests</div>
            <div className="h3 fw-bold mb-0 text-info">{(stats?.total_assignments ?? 0) + (stats?.total_tests ?? 0)}</div>
          </div>
        </div>
      </div>

      {/* SECTION 1: Pending Approvals (CRITICAL ACCESS CONTROL) */}
      <div className="card shadow-sm border-0 mb-4 rounded-3 overflow-hidden">
        <div className="card-header bg-warning bg-opacity-25 py-3 d-flex justify-content-between align-items-center">
          <h5 className="mb-0 fw-bold text-dark">
            <i className="bi bi-shield-lock-fill text-warning me-2"></i>
            Student Access Requests ({pendingStudents.length})
          </h5>
          <span className="badge bg-warning text-dark">Requires Your Approval</span>
        </div>
        <div className="card-body p-0">
          {pendingStudents.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <i className="bi bi-check2-circle fs-2 text-success d-block mb-1"></i>
              No pending student requests! All registrations have been reviewed.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Student Name</th>
                    <th>Email Address</th>
                    <th>Requested On</th>
                    <th>Current Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingStudents.map(student => (
                    <tr key={student.id}>
                      <td className="fw-semibold">{student.name}</td>
                      <td>{student.email}</td>
                      <td className="text-muted small">{student.created_at}</td>
                      <td>
                        <span className="badge bg-warning text-dark">Pending Approval</span>
                      </td>
                      <td className="text-end">
                        <button
                          className="btn btn-sm btn-success me-2"
                          onClick={() => handleStatusChange(student.id, 'approved')}
                        >
                          <i className="bi bi-check-lg me-1"></i> Approve
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleStatusChange(student.id, 'rejected')}
                        >
                          <i className="bi bi-x-lg me-1"></i> Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: All Registered Students Table */}
      <div className="card shadow-sm border-0 rounded-3 overflow-hidden">
        <div className="card-header bg-white py-3">
          <h5 className="mb-0 fw-bold text-secondary">
            <i className="bi bi-people-fill text-primary me-2"></i>
            All Registered Students ({students.length})
          </h5>
        </div>
        <div className="card-body p-0">
          {students.length === 0 ? (
            <div className="text-center py-4 text-muted">
              No students registered yet. Share the registration link with your students!
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th># ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Joined</th>
                    <th>Account Status</th>
                    <th className="text-end">Manage</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student.id}>
                      <td className="text-muted">#{student.id}</td>
                      <td className="fw-semibold">{student.name}</td>
                      <td>{student.email}</td>
                      <td className="text-muted small">{student.created_at}</td>
                      <td>
                        <span className={`badge ${
                          student.status === 'approved' ? 'bg-success' :
                          student.status === 'pending' ? 'bg-warning text-dark' :
                          student.status === 'suspended' ? 'bg-secondary' : 'bg-danger'
                        }`}>
                          {student.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="text-end">
                        {student.status !== 'approved' && (
                          <button
                            className="btn btn-sm btn-outline-success me-1"
                            title="Activate / Approve"
                            onClick={() => handleStatusChange(student.id, 'approved')}
                          >
                            <i className="bi bi-check-circle"></i>
                          </button>
                        )}
                        {student.status === 'approved' && (
                          <button
                            className="btn btn-sm btn-outline-warning me-1"
                            title="Suspend Access"
                            onClick={() => handleStatusChange(student.id, 'suspended')}
                          >
                            <i className="bi bi-pause-circle"></i> Suspend
                          </button>
                        )}
                        <button
                          className="btn btn-sm btn-outline-danger"
                          title="Delete Student"
                          onClick={() => handleDelete(student.id, student.name)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
