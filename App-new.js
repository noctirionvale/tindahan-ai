import React, { useState, useEffect } from 'react';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import ProductDescriptionGenerator from './components/ProductDescriptionGenerator';
import VideoGenerator from './components/VideoGenerator';
import VoiceGenerator from './components/VoiceGenerator';
import Pricing from './components/Pricing';
import Footer from './components/Footer';
import './styles/App.css';
import './styles/Sidebar.css';

function App() {
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('description'); // 'description', 'video', 'voice', 'pricing'

  useEffect(() => {
    const token = localStorage.getItem('tindahan_token');
    const savedUser = localStorage.getItem('tindahan_user');

    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleSignupSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('tindahan_token');
    localStorage.removeItem('tindahan_user');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // If not logged in, show auth pages
  if (!user) {
    return (
      <div className="main-wrapper">
        {authMode === 'login' ? (
          <Login 
            onLoginSuccess={handleLoginSuccess}
            switchToSignup={() => setAuthMode('signup')}
          />
        ) : (
          <Signup 
            onSignupSuccess={handleSignupSuccess}
            switchToLogin={() => setAuthMode('login')}
          />
        )}
      </div>
    );
  }

  // If logged in, show dashboard with sidebar
  return (
    <div className="dashboard-wrapper">
      {/* Top Bar */}
      <div className="top-bar">
        <div className="top-bar-left">
          <img src="pointingai.png" alt="Tindahan.AI" className="top-logo" />
          <span className="top-brand">TINDAHAN.AI</span>
        </div>
        <div className="top-bar-right">
          <span className="welcome-text">Welcome, {user.name}! 👋</span>
          <button onClick={handleLogout} className="logout-btn-top">
            Logout
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="dashboard-body">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <h3>Generators</h3>
            <p>Choose your tool</p>
          </div>

          <nav className="sidebar-nav">
            <button
              className={`sidebar-tab ${activeTab === 'description' ? 'active' : ''}`}
              onClick={() => setActiveTab('description')}
            >
              <span className="tab-icon">📝</span>
              <span className="tab-label">Description</span>
            </button>

            <button
              className={`sidebar-tab ${activeTab === 'video' ? 'active' : ''}`}
              onClick={() => setActiveTab('video')}
            >
              <span className="tab-icon">🎬</span>
              <span className="tab-label">Video</span>
            </button>

            <button
              className={`sidebar-tab ${activeTab === 'voice' ? 'active' : ''}`}
              onClick={() => setActiveTab('voice')}
            >
              <span className="tab-icon">🎙️</span>
              <span className="tab-label">Voice</span>
            </button>

            <button
              className={`sidebar-tab ${activeTab === 'pricing' ? 'active' : ''}`}
              onClick={() => setActiveTab('pricing')}
            >
              <span className="tab-icon">💳</span>
              <span className="tab-label">Pricing</span>
            </button>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="main-content">
          {activeTab === 'description' && <ProductDescriptionGenerator />}
          {activeTab === 'video' && <VideoGenerator />}
          {activeTab === 'voice' && <VoiceGenerator />}
          {activeTab === 'pricing' && <Pricing />}
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;