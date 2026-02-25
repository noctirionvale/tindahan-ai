import React, { useState, useEffect } from 'react';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import ProductDescriptionGenerator from './components/ProductDescriptionGenerator';
import VideoGenerator from './components/VideoGenerator';
import VoiceGenerator from './components/VoiceGenerator';
import Pricing from './components/Pricing';
import AllInOneGenerator from './components/AllInOneGenerator';
import ProfileModal from './components/ProfileModal';
import './styles/App.css';
import './styles/Sidebar.css';

function App() {
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('description');
  const [showFAQ, setShowFAQ] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('tindahan_token');
    const savedUser = localStorage.getItem('tindahan_user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (userData) => setUser(userData);
  const handleSignupSuccess = (userData) => setUser(userData);

  // ✅ FIX: persist user update to localStorage AND state
  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('tindahan_user', JSON.stringify(updatedUser));
  };

  const handleLogout = () => {
    localStorage.removeItem('tindahan_token');
    localStorage.removeItem('tindahan_user');
    setUser(null);
    setShowProfile(false);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

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

  return (
    <div className="dashboard-wrapper">
      {/* Top Bar */}
      <div className="top-bar">
        <div className="top-bar-left">
          <img src="pointingai.png" alt="Tindahan.AI" className="top-logo" />
          <span className="top-brand">TINDAHAN.AI</span>
        </div>
        <div className="top-bar-right">
          <span className="welcome-text">
            👤 Welcome, {user.name}!
          </span>
        </div>
      </div>

      <div className="dashboard-body">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <h3>GENERATORS</h3>
            <p>Choose your tool</p>
          </div>

          <nav className="sidebar-nav">
            <button className={`sidebar-tab ${activeTab === 'description' ? 'active' : ''}`} onClick={() => setActiveTab('description')}>
              <span className="tab-icon">📝</span>
              <span className="tab-label">Description</span>
            </button>
            <button className={`sidebar-tab ${activeTab === 'video' ? 'active' : ''}`} onClick={() => setActiveTab('video')}>
              <span className="tab-icon">🎬</span>
              <span className="tab-label">Video</span>
            </button>
            <button className={`sidebar-tab ${activeTab === 'voice' ? 'active' : ''}`} onClick={() => setActiveTab('voice')}>
              <span className="tab-icon">🎙️</span>
              <span className="tab-label">Voice</span>
            </button>
            <button className={`sidebar-tab ${activeTab === 'package' ? 'active' : ''}`} onClick={() => setActiveTab('package')}>
              <span className="tab-icon">📦</span>
              <span className="tab-label">Package</span>
            </button>
            <button className={`sidebar-tab ${activeTab === 'pricing' ? 'active' : ''}`} onClick={() => setActiveTab('pricing')}>
              <span className="tab-icon">💳</span>
              <span className="tab-label">Pricing</span>
            </button>
          </nav>

          {/* ✅ FIX: Sidebar now shows avatar image if available */}
          <div className="sidebar-profile" onClick={() => setShowProfile(true)}>
            <div className="profile-avatar">
              {user?.avatar_url
                ? <img src={user.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                : user?.name?.charAt(0).toUpperCase()
              }
            </div>
            <div className="profile-info">
              <h4>{user?.name}</h4>
              <span className="plan-badge">{user?.plan || 'Free'} Plan</span>
            </div>
          </div>

          <div className="sidebar-footer">
            <p className="sidebar-tagline">
              Your PINOY AI Content Assistant ang AI Assistant ng Bawat Negosyante. 🇵🇭
            </p>
            <p className="sidebar-credits">© 2026 Made with 💚 in PH</p>
          </div>
        </aside>

        {/* Main Content */}
        <main className={`main-content ${activeTab === 'pricing' ? 'with-footer' : 'full-height'}`}>
          <div className="generator-container">
            {activeTab === 'description' && <ProductDescriptionGenerator />}
            {activeTab === 'video' && <VideoGenerator />}
            {activeTab === 'voice' && <VoiceGenerator />}
            {activeTab === 'package' && <AllInOneGenerator />}
            {activeTab === 'pricing' && <Pricing />}
          </div>

          {activeTab === 'pricing' && (
            <footer className="pricing-footer">
              <div className="footer-content-simple">
                <div className="footer-newsletter">
                  <h3>Get Updates</h3>
                  <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
                    <input type="email" className="newsletter-input" placeholder="Your email" />
                    <button type="submit" className="newsletter-btn">Subscribe</button>
                  </form>
                </div>
                <div className="footer-bottom-row">
                  <div className="footer-links">
                    <a href="#privacy">Privacy Policy</a>
                    <span className="separator">•</span>
                    <a href="#terms">Terms of Service</a>
                    <span className="separator">•</span>
                    <a href="#contact">Contact</a>
                  </div>
                  <div className="footer-social">
                    <a href="https://twitter.com/tindahanai" target="_blank" rel="noopener noreferrer" className="social-icon" title="Twitter">𝕏</a>
                    <a href="https://facebook.com/tindahanai" target="_blank" rel="noopener noreferrer" className="social-icon" title="Facebook">f</a>
                    <a href="https://tiktok.com/@tindahanai" target="_blank" rel="noopener noreferrer" className="social-icon" title="TikTok">♪</a>
                  </div>
                </div>
              </div>
            </footer>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="mobile-bottom-nav">
        <div className="mobile-nav-items">
          <button className={`mobile-nav-item ${activeTab === 'description' ? 'active' : ''}`} onClick={() => setActiveTab('description')}>
            <span className="nav-icon">📝</span>
            <span className="nav-label">Desc</span>
          </button>
          <button className={`mobile-nav-item ${activeTab === 'video' ? 'active' : ''}`} onClick={() => setActiveTab('video')}>
            <span className="nav-icon">🎬</span>
            <span className="nav-label">Video</span>
          </button>
          <button className={`mobile-nav-item ${activeTab === 'voice' ? 'active' : ''}`} onClick={() => setActiveTab('voice')}>
            <span className="nav-icon">🎙️</span>
            <span className="nav-label">Voice</span>
          </button>
          <button className={`mobile-nav-item ${activeTab === 'package' ? 'active' : ''}`} onClick={() => setActiveTab('package')}>
            <span className="nav-icon">📦</span>
            <span className="nav-label">Pack</span>
          </button>
          <button className={`mobile-nav-item ${activeTab === 'pricing' ? 'active' : ''}`} onClick={() => setActiveTab('pricing')}>
            <span className="nav-icon">💳</span>
            <span className="nav-label">Price</span>
          </button>
          <button className="mobile-nav-item profile-nav" onClick={() => setShowProfile(true)}>
            <span className="nav-icon">
              {/* ✅ FIX: Show avatar in mobile nav too */}
              {user?.avatar_url
                ? <img src={user.avatar_url} alt="avatar" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
                : '👤'
              }
            </span>
            <span className="nav-label">Profile</span>
          </button>
        </div>
        <div className="mobile-footer-text">
          <p>🇵🇭 Your PINOY AI Content Assistant</p>
          <p>© 2026 Made with 💚 in PH</p>
        </div>
      </div>

      {/* Floating FAQ Button */}
      <button className="faq-float-btn" onClick={() => setShowFAQ(!showFAQ)} title="Frequently Asked Questions">?</button>

      {/* FAQ Modal */}
      {showFAQ && (
        <div className="faq-modal-overlay" onClick={() => setShowFAQ(false)}>
          <div className="faq-modal" onClick={(e) => e.stopPropagation()}>
            <button className="faq-close" onClick={() => setShowFAQ(false)}>×</button>
            <h2 className="faq-title">Frequently Asked Questions</h2>
            <div className="faq-list">
              <div className="faq-item">
                <h4>How many free generations do I get?</h4>
                <p>You get 15 lifetime free descriptions, 1 video, and 1 voice generation - no time limit!</p>
              </div>
              <div className="faq-item">
                <h4>Can I cancel anytime?</h4>
                <p>Yes! Cancel anytime. Just email us at spawntaneousbulb@gmail.com</p>
              </div>
              <div className="faq-item">
                <h4>How do I pay?</h4>
                <p>Filipino users can pay via GCash. International users via credit/debit card (coming soon).</p>
              </div>
              <div className="faq-item">
                <h4>How long before my account is upgraded?</h4>
                <p>Within 24 hours after payment confirmation. Usually much faster!</p>
              </div>
              <div className="faq-item">
                <h4>Do you offer refunds?</h4>
                <p>Yes! 30-day money-back guarantee on all paid plans.</p>
              </div>
              <div className="faq-item">
                <h4>Is my data safe?</h4>
                <p>Yes! We use industry-standard encryption and never share your data.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ FIX: setUser now passed to ProfileModal */}
      {showProfile && (
        <ProfileModal
          user={user}
          setUser={handleUserUpdate}
          onClose={() => setShowProfile(false)}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

export default App;