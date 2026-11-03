import { useState, useEffect } from 'react';
import { apiRequest } from './api';
import Auth from './components/Auth';
import AdminDashboard from './components/AdminDashboard';
import StudentDashboard from './components/StudentDashboard';
import ClassList from './components/ClassList';
import LiveClassroom from './components/LiveClassroom';
import Assignments from './components/Assignments';
import MCQTests from './components/MCQTests';
import ReadingLibrary from './components/ReadingLibrary';
import Performance from './components/Performance';
import Announcements from './components/Announcements';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'classes' | 'assignments' | 'tests' | 'library' | 'performance' | 'announcements'
  const [activeClassroom, setActiveClassroom] = useState(null);

  // Check saved session on load
  useEffect(() => {
    const savedUser = localStorage.getItem('tuition_user');
    const token = localStorage.getItem('tuition_token');

    if (savedUser && token) {
      try {
        setCurrentUser(JSON.parse(savedUser));
        apiRequest('/auth/me')
          .then(data => {
            if (data.user) {
              setCurrentUser(data.user);
              localStorage.setItem('tuition_user', JSON.stringify(data.user));
            }
          })
          .catch(() => {
            handleLogout();
          })
          .finally(() => setLoading(false));
      } catch (e) {
        handleLogout();
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('tuition_token');
    localStorage.removeItem('tuition_user');
    setCurrentUser(null);
    setActiveClassroom(null);
    setActiveTab('dashboard');
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setActiveTab('dashboard');
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex justify-content-center align-items-center bg-light">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading English Tuition App...</span>
        </div>
      </div>
    );
  }

  // If currently inside an active video/whiteboard classroom
  if (currentUser && activeClassroom) {
    return (
      <div className="min-vh-100 bg-light">
        <LiveClassroom
          classItem={activeClassroom}
          user={currentUser}
          onLeave={() => setActiveClassroom(null)}
        />
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light d-flex flex-column">
      {/* Top Navigation Bar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm sticky-top">
        <div className="container">
          <span
            className="navbar-brand fw-bold fs-4 d-flex align-items-center"
            onClick={() => setActiveTab('dashboard')}
            style={{ cursor: 'pointer' }}
          >
            <i className="bi bi-mortarboard-fill me-2 fs-3"></i>
            English Tuition Portal
          </span>

          {currentUser && (
            <div className="navbar-nav me-auto ms-lg-3 d-flex flex-row flex-wrap gap-1">
              <button
                className={`btn btn-sm ${activeTab === 'dashboard' ? 'btn-light text-primary fw-bold' : 'btn-outline-light border-0'}`}
                onClick={() => setActiveTab('dashboard')}
              >
                <i className="bi bi-speedometer2 me-1"></i> Dashboard
              </button>
              <button
                className={`btn btn-sm ${activeTab === 'classes' ? 'btn-light text-primary fw-bold' : 'btn-outline-light border-0'}`}
                onClick={() => setActiveTab('classes')}
              >
                <i className="bi bi-camera-video me-1"></i> Live Classes
              </button>
              <button
                className={`btn btn-sm ${activeTab === 'assignments' ? 'btn-light text-primary fw-bold' : 'btn-outline-light border-0'}`}
                onClick={() => setActiveTab('assignments')}
              >
                <i className="bi bi-journal-check me-1"></i> Assignments
              </button>
              <button
                className={`btn btn-sm ${activeTab === 'tests' ? 'btn-light text-primary fw-bold' : 'btn-outline-light border-0'}`}
                onClick={() => setActiveTab('tests')}
              >
                <i className="bi bi-ui-checks-grid me-1"></i> Tests
              </button>
              <button
                className={`btn btn-sm ${activeTab === 'library' ? 'btn-light text-primary fw-bold' : 'btn-outline-light border-0'}`}
                onClick={() => setActiveTab('library')}
              >
                <i className="bi bi-book-half me-1"></i> Library
              </button>
              <button
                className={`btn btn-sm ${activeTab === 'performance' ? 'btn-light text-primary fw-bold' : 'btn-outline-light border-0'}`}
                onClick={() => setActiveTab('performance')}
              >
                <i className="bi bi-trophy me-1"></i> Ranks
              </button>
              <button
                className={`btn btn-sm ${activeTab === 'announcements' ? 'btn-light text-primary fw-bold' : 'btn-outline-light border-0'}`}
                onClick={() => setActiveTab('announcements')}
              >
                <i className="bi bi-megaphone me-1"></i> Notices
              </button>
            </div>
          )}

          <div className="d-flex align-items-center gap-3">
            {currentUser ? (
              <>
                <span className="badge bg-light text-primary px-3 py-2 rounded-pill fw-semibold d-none d-xl-inline">
                  <i className={`bi ${currentUser.role === 'admin' ? 'bi-person-badge-fill text-danger' : 'bi-person-check-fill text-success'} me-1`}></i>
                  {currentUser.role === 'admin' ? 'Teacher / Admin' : 'Student'}
                </span>
                <span className="text-white d-none d-md-inline fw-semibold">
                  {currentUser.name}
                </span>
                <button
                  className="btn btn-outline-light btn-sm rounded-pill px-3"
                  onClick={handleLogout}
                >
                  <i className="bi bi-box-arrow-right me-1"></i> Sign Out
                </button>
              </>
            ) : (
              <span className="badge bg-light text-primary px-3 py-2 rounded-pill">
                <i className="bi bi-shield-check me-1"></i> Secure Access
              </span>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-grow-1">
        {!currentUser ? (
          <Auth onLoginSuccess={handleLoginSuccess} />
        ) : activeTab === 'classes' ? (
          <ClassList
            user={currentUser}
            onEnterClassroom={(cls) => setActiveClassroom(cls)}
          />
        ) : activeTab === 'assignments' ? (
          <Assignments user={currentUser} />
        ) : activeTab === 'tests' ? (
          <MCQTests user={currentUser} />
        ) : activeTab === 'library' ? (
          <ReadingLibrary user={currentUser} />
        ) : activeTab === 'performance' ? (
          <Performance user={currentUser} />
        ) : activeTab === 'announcements' ? (
          <Announcements user={currentUser} />
        ) : currentUser.role === 'admin' ? (
          <AdminDashboard user={currentUser} />
        ) : (
          <StudentDashboard
            user={currentUser}
            onNavigateToClasses={() => setActiveTab('classes')}
            onNavigateToAssignments={() => setActiveTab('assignments')}
            onNavigateToTests={() => setActiveTab('tests')}
            onNavigateToLibrary={() => setActiveTab('library')}
            onNavigateToPerformance={() => setActiveTab('performance')}
            onNavigateToAnnouncements={() => setActiveTab('announcements')}
          />
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-top py-3 text-center text-muted small mt-auto">
        <div className="container">
          &copy; {new Date().getFullYear()} Online English Tuition System &bull; Powered by React.js, Python Flask & MySQL
        </div>
      </footer>
    </div>
  );
}

export default App;
