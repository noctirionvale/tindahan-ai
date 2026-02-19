import React, { useState, useEffect } from 'react';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import Hero from './components/Hero';
import ProductDescriptionGenerator from './components/ProductDescriptionGenerator';
import Analytics from './components/Analytics';
import Pricing from './components/Pricing';
import Footer from './components/Footer';
import './styles/App.css';
import VideoGenerator from './components/VideoGenerator';

function App() {
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in
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
    return <div>Loading...</div>;
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

  // If logged in, show main app
  return (
    <div className="main-wrapper">
      <main className="content-center">
        
        {/* Logo */}
        <div className="logo-container">
          <img src="pointingai.png" alt="Tindahan.AI Logo" className="logo-image" />
        </div>

        {/* User Info */}
        <div className="user-bar">
          <span>Welcome, {user.name}! 👋</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>

        {/* Main Content */}
        <Hero />
        <ProductDescriptionGenerator />
        <VideoGenerator />
        <Analytics />
        <Pricing />
        <Footer />
        
      </main>
    </div>
  );
}

export default App;