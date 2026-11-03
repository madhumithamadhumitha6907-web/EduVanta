import { useState } from 'react';
import Whiteboard from './Whiteboard';

export default function LiveClassroom({ classItem, user, onLeave }) {
  const [activeTab, setActiveTab] = useState('both'); // 'both' | 'video' | 'whiteboard'

  // Construct secure, free Jitsi meeting URL
  const jitsiUrl = `https://meet.jit.si/${classItem.meeting_code}#userInfo.displayName="${encodeURIComponent(user.name)}"&config.prejoinPageEnabled=false&config.startWithAudioMuted=true`;

  return (
    <div className="container-fluid py-3 px-md-4">
      {/* Classroom Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 pb-2 border-bottom">
        <div className="d-flex align-items-center gap-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={onLeave}>
            <i className="bi bi-arrow-left me-1"></i> Exit Class
          </button>
          <div>
            <h4 className="fw-bold mb-0 text-primary">
              <i className="bi bi-camera-video me-2"></i>{classItem.title}
            </h4>
            <small className="text-muted">Meeting Code: <code>{classItem.meeting_code}</code></small>
          </div>
        </div>

        {/* View Layout Controls */}
        <div className="btn-group btn-group-sm">
          <button
            className={`btn ${activeTab === 'both' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setActiveTab('both')}
          >
            <i className="bi bi-layout-split me-1"></i> Side-by-Side
          </button>
          <button
            className={`btn ${activeTab === 'video' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setActiveTab('video')}
          >
            <i className="bi bi-camera-video me-1"></i> Video Only
          </button>
          <button
            className={`btn ${activeTab === 'whiteboard' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setActiveTab('whiteboard')}
          >
            <i className="bi bi-easel me-1"></i> Whiteboard Only
          </button>
        </div>
      </div>

      {/* Classroom Content Area */}
      <div className="row g-3">
        {/* Video Conference Box */}
        {(activeTab === 'both' || activeTab === 'video') && (
          <div className={activeTab === 'both' ? 'col-lg-5' : 'col-12'}>
            <div className="card shadow-sm border-0 rounded-3 overflow-hidden bg-dark" style={{ height: '620px' }}>
              <div className="card-header bg-dark text-white py-2 px-3 d-flex justify-content-between align-items-center">
                <span className="small">
                  <i className="bi bi-broadcast text-danger me-1"></i> Jitsi Live Video & Audio
                </span>
                <a
                  href={`https://meet.jit.si/${classItem.meeting_code}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-outline-light py-0"
                >
                  <i className="bi bi-box-arrow-up-right me-1"></i> Pop-out
                </a>
              </div>
              <iframe
                src={jitsiUrl}
                title="Live Video Classroom"
                allow="camera; microphone; fullscreen; display-capture"
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </div>
          </div>
        )}

        {/* Interactive Whiteboard Box */}
        {(activeTab === 'both' || activeTab === 'whiteboard') && (
          <div className={activeTab === 'both' ? 'col-lg-7' : 'col-12'}>
            <Whiteboard classId={classItem.id} user={user} />
          </div>
        )}
      </div>
    </div>
  );
}
