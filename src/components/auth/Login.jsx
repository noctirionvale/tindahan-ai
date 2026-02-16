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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('https://tindahan-ai-production.up.railway.app/api/auth/login', formData);

      if (response.data.success) {
        // Save token to localStorage
        localStorage.setItem('tindahan_token', response.data.token);
        localStorage.setItem('tindahan_user', JSON.stringify(response.data.user));

        // Call success callback
        onLoginSuccess(response.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
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

        <div className="auth-footer">
          <p>
            Wala pang account?{' '}
            <button onClick={switchToSignup} className="auth-link">
              Sign up here
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;