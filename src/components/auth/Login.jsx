import React, { useState } from 'react';
import axios from 'axios';
import './Auth.css';

const Login = ({ onLoginSuccess, switchToSignup }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('https://tindahan-ai-production.up.railway.app/api/auth/login', formData);

      if (response.data.success) {
        localStorage.setItem('tindahan_token', response.data.token);
        localStorage.setItem('tindahan_user', JSON.stringify(response.data.user));
        onLoginSuccess(response.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Long press handlers
  const handleLongPressStart = () => {
    const timer = setTimeout(() => {
      setShowSocialModal(true);
    }, 500); // 500ms = half second
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleSocialLogin = (provider) => {
    // TODO: Implement OAuth later
    alert(`${provider} login coming soon! For now, please use email/password.`);
    setShowSocialModal(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        
        <div className="auth-header">
          <h2>Welcome Back! 👋</h2>
          <p>Login to Tindahan.AI</p>
        </div>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="juan@gmail.com"
              required
              className="auth-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                minLength={6}
                className="auth-input"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="auth-button primary"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

        </form>

        {/* Long Press Social Login Button */}
        <div className="social-login-section">
          <div className="divider">
            <span>or</span>
          </div>
          
          <button
            type="button"
            className="long-press-button"
            onClick={() => setShowSocialModal(true)} // Click for desktop
            onTouchStart={handleLongPressStart} // Long press for mobile
            onTouchEnd={handleLongPressEnd}
            onMouseDown={handleLongPressStart} // Long press for desktop
            onMouseUp={handleLongPressEnd}
            onMouseLeave={handleLongPressEnd}
          >
            <span className="button-icon">🌐</span>
            <div className="button-text">
              <span className="main-text">More Login Options</span>
              <span className="sub-text">👆 Tap or Long Press</span>
            </div>
          </button>
        </div>

        <div className="auth-footer">
          <p>
            Wala pang account?{' '}
            <button onClick={switchToSignup} className="auth-link">
              Sign up here
            </button>
          </p>
        </div>

      </div>

      {/* Social Login Modal */}
      {showSocialModal && (
        <div className="modal-overlay" onClick={() => setShowSocialModal(false)}>
          <div className="social-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowSocialModal(false)}>✕</button>
            
            <h3>Choose Login Method</h3>
            <p className="modal-subtitle">Quick login with your social account</p>

            <div className="social-buttons">
              <button 
                className="social-button google"
                onClick={() => handleSocialLogin('Google')}
              >
                <svg viewBox="0 0 24 24" className="social-icon">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              <button 
                className="social-button facebook"
                onClick={() => handleSocialLogin('Facebook')}
              >
                <svg viewBox="0 0 24 24" className="social-icon">
                  <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Continue with Facebook
              </button>

              <button 
                className="social-button twitter"
                onClick={() => handleSocialLogin('X (Twitter)')}
              >
                <svg viewBox="0 0 24 24" className="social-icon">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                Continue with X
              </button>

              <button 
                className="social-button apple"
                onClick={() => handleSocialLogin('Apple')}
              >
                <svg viewBox="0 0 24 24" className="social-icon">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Continue with Apple
              </button>
            </div>
            

            <p className="modal-note">
              <small>🚧 Social login coming soon! For now, please use email/password.</small>
            </p>
          </div>
        </div>
      )}

    </div>
  );
};

export default Login;