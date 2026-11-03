import { useState } from 'react';
import { apiRequest } from '../api';

export default function Auth({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAlert(null);
    setLoading(true);

    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      localStorage.setItem('tuition_token', data.token);
      localStorage.setItem('tuition_user', JSON.stringify(data.user));
      onLoginSuccess(data.user);
    } catch (err) {
      setAlert({
        type: 'danger',
        message: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAlert(null);

    if (formData.password !== formData.confirmPassword) {
      setAlert({ type: 'warning', message: 'Passwords do not match.' });
      return;
    }

    setLoading(true);
    try {
      const data = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        })
      });

      setAlert({
        type: 'success',
        message: 'Registration successful! Your account is now pending approval by the teacher. Please wait for the teacher to approve your access.'
      });
      setIsRegister(false);
      setFormData({ name: '', email: '', password: '', confirmPassword: '' });
    } catch (err) {
      setAlert({ type: 'danger', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const fillTeacherDemo = () => {
    setFormData({
      ...formData,
      email: 'admin@tuition.com',
      password: 'Admin@123'
    });
    setAlert({
      type: 'info',
      message: 'Teacher Admin credentials pre-filled! Click "Sign In" below.'
    });
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-7 col-lg-5">
          <div className="card shadow border-0 rounded-4 overflow-hidden">
            <div className="card-header bg-primary text-white text-center py-4">
              <i className="bi bi-mortarboard-fill display-4 mb-2 d-inline-block"></i>
              <h3 className="fw-bold mb-1">English Tuition Portal</h3>
              <p className="mb-0 text-white-50">
                {isRegister ? 'Student Registration' : 'Sign in to Your Account'}
              </p>
            </div>

            <div className="card-body p-4 p-md-5">
              {/* Alert notifications */}
              {alert && (
                <div className={`alert alert-${alert.type} d-flex align-items-center mb-3`} role="alert">
                  <i className={`bi ${alert.type === 'success' ? 'bi-check-circle-fill' : alert.type === 'info' ? 'bi-info-circle-fill' : 'bi-exclamation-triangle-fill'} fs-4 me-2`}></i>
                  <div>{alert.message}</div>
                </div>
              )}

              {/* Form Navigation Tabs */}
              <ul className="nav nav-pills nav-fill mb-4 p-1 bg-light rounded-3">
                <li className="nav-item">
                  <button
                    className={`nav-link fw-semibold ${!isRegister ? 'active' : ''}`}
                    onClick={() => { setIsRegister(false); setAlert(null); }}
                  >
                    <i className="bi bi-box-arrow-in-right me-1"></i> Sign In
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link fw-semibold ${isRegister ? 'active' : ''}`}
                    onClick={() => { setIsRegister(true); setAlert(null); }}
                  >
                    <i className="bi bi-person-plus me-1"></i> Register as Student
                  </button>
                </li>
              </ul>

              {!isRegister ? (
                /* Login Form */
                <form onSubmit={handleLogin}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Email Address</label>
                    <div className="input-group">
                      <span className="input-group-text"><i className="bi bi-envelope"></i></span>
                      <input
                        type="email"
                        name="email"
                        className="form-control"
                        placeholder="e.g. student@gmail.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Password</label>
                    <div className="input-group">
                      <span className="input-group-text"><i className="bi bi-lock"></i></span>
                      <input
                        type="password"
                        name="password"
                        className="form-control"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-2 fw-semibold rounded-3 mb-3"
                    disabled={loading}
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </button>

                  <div className="p-3 bg-light rounded-3 text-center border">
                    <small className="text-muted d-block mb-2">Teacher / Administrator Login:</small>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={fillTeacherDemo}
                    >
                      <i className="bi bi-key-fill me-1"></i> Fill Teacher Admin Credentials
                    </button>
                  </div>
                </form>
              ) : (
                /* Student Registration Form */
                <form onSubmit={handleRegister}>
                  <div className="alert alert-info py-2 small mb-3">
                    <i className="bi bi-shield-check me-1"></i>
                    <strong>Note:</strong> New student accounts must be approved by the teacher before signing in.
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Full Name</label>
                    <div className="input-group">
                      <span className="input-group-text"><i className="bi bi-person"></i></span>
                      <input
                        type="text"
                        name="name"
                        className="form-control"
                        placeholder="e.g. Rahul Sharma"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Email Address</label>
                    <div className="input-group">
                      <span className="input-group-text"><i className="bi bi-envelope"></i></span>
                      <input
                        type="email"
                        name="email"
                        className="form-control"
                        placeholder="e.g. rahul@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Password (min 6 chars)</label>
                    <div className="input-group">
                      <span className="input-group-text"><i className="bi bi-lock"></i></span>
                      <input
                        type="password"
                        name="password"
                        className="form-control"
                        placeholder="Create a strong password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold">Confirm Password</label>
                    <div className="input-group">
                      <span className="input-group-text"><i className="bi bi-check2-circle"></i></span>
                      <input
                        type="password"
                        name="confirmPassword"
                        className="form-control"
                        placeholder="Repeat your password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-2 fw-semibold rounded-3"
                    disabled={loading}
                  >
                    {loading ? 'Submitting...' : 'Register for Classes'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
