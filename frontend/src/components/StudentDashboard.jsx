export default function StudentDashboard({ user, onNavigateToClasses, onNavigateToAssignments, onNavigateToTests, onNavigateToLibrary, onNavigateToPerformance, onNavigateToAnnouncements }) {
  return (
    <div className="container py-4">
      {/* Student Welcome Banner */}
      <div className="card shadow-sm border-0 rounded-4 overflow-hidden mb-4 bg-primary text-white">
        <div className="card-body p-4 p-md-5">
          <div className="row align-items-center">
            <div className="col-md-8">
              <span className="badge bg-light text-primary px-3 py-2 mb-2 rounded-pill fw-semibold">
                <i className="bi bi-patch-check-fill me-1"></i> Enrolled & Approved Student
              </span>
              <h1 className="fw-bold mb-2">Hello, {user.name}!</h1>
              <p className="lead mb-0 text-white-50">
                Welcome to your English Tuition Learning Portal. Access your live classes, homework, tests, and reading library below.
              </p>
            </div>
            <div className="col-md-4 text-center d-none d-md-block">
              <i className="bi bi-mortarboard display-1 text-white-50"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access Modules Grid */}
      <h4 className="fw-bold text-secondary mb-3">Your Learning Modules</h4>
      <div className="row g-3">
        {/* Module 1: Live Classes */}
        <div className="col-md-4">
          <div className="card h-100 border-0 shadow-sm rounded-3 p-3">
            <div className="d-flex align-items-center mb-3">
              <div className="p-3 bg-primary bg-opacity-10 text-primary rounded-3 me-3">
                <i className="bi bi-camera-video-fill fs-3"></i>
              </div>
              <div>
                <h5 className="fw-bold mb-0">Live English Classes</h5>
                <small className="text-muted">Interactive Jitsi Meeting</small>
              </div>
            </div>
            <p className="text-muted small">
              Join scheduled live classes with video, audio, and real-time questions.
            </p>
            <button className="btn btn-primary btn-sm mt-auto" onClick={onNavigateToClasses}>
              <i className="bi bi-camera-video me-1"></i> View Scheduled Classes
            </button>
          </div>
        </div>

        {/* Module 2: Interactive Whiteboard */}
        <div className="col-md-4">
          <div className="card h-100 border-0 shadow-sm rounded-3 p-3">
            <div className="d-flex align-items-center mb-3">
              <div className="p-3 bg-success bg-opacity-10 text-success rounded-3 me-3">
                <i className="bi bi-easel-fill fs-3"></i>
              </div>
              <div>
                <h5 className="fw-bold mb-0">Live Whiteboard</h5>
                <small className="text-muted">Grammar & Vocabulary Board</small>
              </div>
            </div>
            <p className="text-muted small">
              View live teaching notes, grammar formulas, and teacher drawings in real time.
            </p>
            <button className="btn btn-outline-success btn-sm mt-auto" disabled>
              <i className="bi bi-broadcast me-1"></i> Awaiting teacher stream
            </button>
          </div>
        </div>

        {/* Module 3: Assignments */}
        <div className="col-md-4">
          <div className="card h-100 border-0 shadow-sm rounded-3 p-3">
            <div className="d-flex align-items-center mb-3">
              <div className="p-3 bg-warning bg-opacity-10 text-warning rounded-3 me-3">
                <i className="bi bi-journal-check fs-3"></i>
              </div>
              <div>
                <h5 className="fw-bold mb-0">Daily Assignments</h5>
                <small className="text-muted">Homework & Feedback</small>
              </div>
            </div>
            <p className="text-muted small">
              Upload completed worksheets, submit homework, and receive teacher corrections.
            </p>
            <button className="btn btn-warning btn-sm mt-auto fw-semibold" onClick={onNavigateToAssignments}>
              <i className="bi bi-file-earmark-arrow-up me-1"></i> View & Submit Assignments
            </button>
          </div>
        </div>

        {/* Module 4: Weekly MCQ Tests */}
        <div className="col-md-4">
          <div className="card h-100 border-0 shadow-sm rounded-3 p-3">
            <div className="d-flex align-items-center mb-3">
              <div className="p-3 bg-danger bg-opacity-10 text-danger rounded-3 me-3">
                <i className="bi bi-ui-checks-grid fs-3"></i>
              </div>
              <div>
                <h5 className="fw-bold mb-0">Weekly MCQ Tests</h5>
                <small className="text-muted">Online English Quizzes</small>
              </div>
            </div>
            <p className="text-muted small">
              Take timed tests on English grammar, vocabulary, comprehension, and view scores.
            </p>
            <button className="btn btn-danger btn-sm mt-auto fw-semibold" onClick={onNavigateToTests}>
              <i className="bi bi-pencil-square me-1"></i> View & Take Weekly Tests
            </button>
          </div>
        </div>

        {/* Module 5: English Reading Library */}
        <div className="col-md-4">
          <div className="card h-100 border-0 shadow-sm rounded-3 p-3">
            <div className="d-flex align-items-center mb-3">
              <div className="p-3 bg-info bg-opacity-10 text-info rounded-3 me-3">
                <i className="bi bi-book-half fs-3"></i>
              </div>
              <div>
                <h5 className="fw-bold mb-0">Reading Library</h5>
                <small className="text-muted">Stories & Vocabulary</small>
              </div>
            </div>
            <p className="text-muted small">
              Explore short stories, moral stories, vocabulary lists, and practice reading skills.
            </p>
            <button className="btn btn-info btn-sm mt-auto text-white fw-semibold" onClick={onNavigateToLibrary}>
              <i className="bi bi-book me-1"></i> Open Reading Library
            </button>
          </div>
        </div>

        {/* Module 6: Performance & Ranking */}
        <div className="col-md-4">
          <div className="card h-100 border-0 shadow-sm rounded-3 p-3">
            <div className="d-flex align-items-center mb-3">
              <div className="p-3 bg-secondary bg-opacity-10 text-secondary rounded-3 me-3">
                <i className="bi bi-trophy-fill fs-3"></i>
              </div>
              <div>
                <h5 className="fw-bold mb-0">Performance & Rank</h5>
                <small className="text-muted">Marks & Class Leaderboard</small>
              </div>
            </div>
            <p className="text-muted small">
              Track your weekly progress, attendance percentage, and class ranking.
            </p>
            <button className="btn btn-secondary btn-sm mt-auto fw-semibold" onClick={onNavigateToPerformance}>
              <i className="bi bi-bar-chart me-1"></i> View My Report & Ranks
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
