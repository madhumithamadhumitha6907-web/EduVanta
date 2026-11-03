import { useState, useEffect } from 'react';
import { apiRequest } from '../api';

export default function Performance({ user }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [myReport, setMyReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(user.role === 'admin' ? 'leaderboard' : 'my_report');
  const [alert, setAlert] = useState(null);

  const isTeacher = user.role === 'admin';

  const fetchData = async () => {
    try {
      setLoading(true);
      if (isTeacher) {
        const lbData = await apiRequest('/performance/leaderboard');
        setLeaderboard(lbData.leaderboard || []);
      } else {
        const [lbData, reportData] = await Promise.all([
          apiRequest('/performance/leaderboard'),
          apiRequest('/performance/my-report')
        ]);
        setLeaderboard(lbData.leaderboard || []);
        setMyReport(reportData);
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const myRankObj = leaderboard.find(s => s.student_id === user.id);

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-bold mb-1 text-primary">
            <i className="bi bi-trophy-fill me-2 text-warning"></i>Student Performance & Rankings
          </h2>
          <p className="text-muted mb-0">
            {isTeacher
              ? 'Track overall class marks, rankings, and student attendance analytics.'
              : 'View your grades, test history, attendance progress, and class ranking.'}
          </p>
        </div>

        {!isTeacher && (
          <div className="btn-group btn-group-sm">
            <button
              className={`btn ${activeTab === 'my_report' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setActiveTab('my_report')}
            >
              <i className="bi bi-person-lines-fill me-1"></i> My Report Card
            </button>
            <button
              className={`btn ${activeTab === 'leaderboard' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setActiveTab('leaderboard')}
            >
              <i className="bi bi-trophy me-1"></i> Class Leaderboard
            </button>
          </div>
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
      ) : activeTab === 'my_report' && !isTeacher ? (
        /* Student Personalized Report Card */
        <div>
          {/* Top KPI Summary */}
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <div className="card shadow-sm border-0 rounded-4 p-4 text-center bg-white border-bottom border-warning border-4">
                <i className="bi bi-award-fill display-4 text-warning mb-2"></i>
                <div className="text-muted small text-uppercase fw-bold">Class Rank</div>
                <div className="display-6 fw-bold text-dark">
                  #{myRankObj?.rank ?? '-'}
                </div>
                <small className="text-muted">Out of {leaderboard.length} enrolled students</small>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card shadow-sm border-0 rounded-4 p-4 text-center bg-white border-bottom border-success border-4">
                <i className="bi bi-percent display-4 text-success mb-2"></i>
                <div className="text-muted small text-uppercase fw-bold">Overall Percentage</div>
                <div className="display-6 fw-bold text-success">
                  {myRankObj?.overall_pct ?? 0}%
                </div>
                <small className="text-muted">
                  Earned {myRankObj?.total_earned ?? 0} / {myRankObj?.total_possible ?? 0} marks
                </small>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card shadow-sm border-0 rounded-4 p-4 text-center bg-white border-bottom border-info border-4">
                <i className="bi bi-calendar-check-fill display-4 text-info mb-2"></i>
                <div className="text-muted small text-uppercase fw-bold">Attendance Rate</div>
                <div className="display-6 fw-bold text-info">
                  {myReport?.attendance_pct ?? 100}%
                </div>
                <small className="text-muted">
                  Attended {myReport?.attended_classes ?? 0} of {myReport?.total_classes ?? 0} live classes
                </small>
              </div>
            </div>
          </div>

          {/* Test & Assignment Details */}
          <div className="row g-4">
            {/* Weekly Tests Record */}
            <div className="col-lg-6">
              <div className="card shadow-sm border-0 rounded-4 overflow-hidden bg-white">
                <div className="card-header bg-light py-3">
                  <h5 className="fw-bold mb-0 text-dark">
                    <i className="bi bi-ui-checks-grid text-danger me-2"></i>Weekly Tests Record
                  </h5>
                </div>
                <div className="card-body p-0">
                  {myReport?.test_history?.length === 0 ? (
                    <p className="text-muted text-center py-4 mb-0">No tests taken yet.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Test Title</th>
                            <th>Date</th>
                            <th className="text-end">Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {myReport?.test_history?.map((t, idx) => (
                            <tr key={idx}>
                              <td className="fw-semibold">{t.test_title}</td>
                              <td className="small text-muted">{t.submitted_at}</td>
                              <td className="text-end">
                                {t.results_published ? (
                                  <span className="badge bg-success fs-6">
                                    {t.score} / {t.total_marks}
                                  </span>
                                ) : (
                                  <span className="badge bg-secondary">Pending Publish</span>
                                )}
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

            {/* Assignments & Homework Record */}
            <div className="col-lg-6">
              <div className="card shadow-sm border-0 rounded-4 overflow-hidden bg-white">
                <div className="card-header bg-light py-3">
                  <h5 className="fw-bold mb-0 text-dark">
                    <i className="bi bi-journal-check text-primary me-2"></i>Assignments Record
                  </h5>
                </div>
                <div className="card-body p-0">
                  {myReport?.assignment_history?.length === 0 ? (
                    <p className="text-muted text-center py-4 mb-0">No assignments submitted yet.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Assignment</th>
                            <th>Marks</th>
                            <th>Teacher Feedback</th>
                          </tr>
                        </thead>
                        <tbody>
                          {myReport?.assignment_history?.map((a, idx) => (
                            <tr key={idx}>
                              <td className="fw-semibold">{a.assignment_title}</td>
                              <td>
                                {a.marks_awarded !== null ? (
                                  <span className="badge bg-primary">
                                    {a.marks_awarded} / {a.total_marks}
                                  </span>
                                ) : (
                                  <span className="badge bg-warning text-dark">Awaiting Review</span>
                                )}
                              </td>
                              <td className="small text-muted">
                                {a.feedback || 'No feedback written yet.'}
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
          </div>
        </div>
      ) : (
        /* Class Leaderboard Table */
        <div className="card shadow-sm border-0 rounded-4 overflow-hidden bg-white">
          <div className="card-header bg-light py-3 d-flex justify-content-between align-items-center">
            <h5 className="fw-bold mb-0 text-dark">
              <i className="bi bi-trophy-fill text-warning me-2"></i>Class Leaderboard & Rankings
            </h5>
            <span className="badge bg-primary">{leaderboard.length} Students Ranked</span>
          </div>
          <div className="card-body p-0">
            {leaderboard.length === 0 ? (
              <p className="text-muted text-center py-5 mb-0">No student performance records available yet.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '80px' }}>Rank</th>
                      <th>Student Name</th>
                      <th>Email</th>
                      <th>MCQ Tests</th>
                      <th>Assignments</th>
                      <th>Attendance</th>
                      <th>Total Marks</th>
                      <th className="text-end">Overall %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((student) => (
                      <tr
                        key={student.student_id}
                        className={student.student_id === user.id ? 'table-warning fw-semibold' : ''}
                      >
                        <td>
                          <span className={`badge fs-6 ${
                            student.rank === 1 ? 'bg-warning text-dark' :
                            student.rank === 2 ? 'bg-secondary' :
                            student.rank === 3 ? 'bg-info text-dark' : 'bg-light text-dark border'
                          }`}>
                            #{student.rank}
                          </span>
                        </td>
                        <td className="fw-bold">
                          {student.name}
                          {student.student_id === user.id && (
                            <span className="badge bg-primary ms-2 small">You</span>
                          )}
                        </td>
                        <td className="text-muted small">{student.email}</td>
                        <td>{student.test_score} / {student.test_total}</td>
                        <td>{student.assignment_score} / {student.assignment_total}</td>
                        <td>
                          <span className={`badge ${student.attendance_pct >= 80 ? 'bg-success' : student.attendance_pct >= 50 ? 'bg-warning text-dark' : 'bg-danger'}`}>
                            {student.attendance_pct}%
                          </span>
                        </td>
                        <td className="fw-semibold">{student.total_earned} / {student.total_possible}</td>
                        <td className="text-end">
                          <span className={`badge fs-6 ${
                            student.overall_pct >= 85 ? 'bg-success' :
                            student.overall_pct >= 60 ? 'bg-primary' :
                            student.overall_pct >= 40 ? 'bg-warning text-dark' : 'bg-secondary'
                          }`}>
                            {student.overall_pct}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
