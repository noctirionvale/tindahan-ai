import React, { useState } from 'react';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  // 1. State for the newsletter form
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 2. Handle form submission with Web3Forms
  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          access_key: "9563fcfc-3166-4c5b-a804-6399d77596c9",
          subject: "New Tindahan.AI Newsletter Subscription 🇵🇭",
          email: email,
        })
      });

      const result = await response.json();

      if (result.success) {
        // Success! Show the thank you message
        setIsSubscribed(true);
        setEmail(''); 
      } else {
        alert("Oops! There was a problem joining the newsletter: " + result.message);
      }
    } catch (error) {
      alert("Network error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. The actual UI rendered on the screen
  return (
    <footer className="footer-section">
      
      {/* Decorative Wave */}
      <div className="footer-wave">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" opacity=".1"></path>
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" opacity=".2"></path>
        </svg>
      </div>

      <div className="footer-content">
        <div className="footer-main">
          
          {/* Column 1: Brand / About */}
          <div className="footer-column about">
            <div className="footer-brand">
              <img src="pointingai.png" alt="Tindahan.AI" className="footer-logo" />
            </div>
            <p className="footer-tagline">
              Your PINOY AI Content Assistant ang AI Assistant ng Bawat Negosyante. 🇵🇭
            </p>
          </div>

          {/* Column 2: Connect (Socials) */}
          <div className="footer-column">
            <h4>Connect</h4>
            <div className="social-links">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-link twitter">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
                </svg>
                Twitter
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-link facebook">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
                </svg>
                Facebook
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="social-link tiktok">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                </svg>
                TikTok
              </a>
            </div>
          </div>

          {/* Column 3: Newsletter */}
          <div className="footer-column newsletter">
            <h4>Get Updates</h4>
            
            {isSubscribed ? (
              <div className="newsletter-success">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span>Salamat! You're on the list.</span>
              </div>
            ) : (
              <form className="newsletter-form" onSubmit={handleSubscribe}>
                <input 
                  type="email" 
                  name="email"
                  placeholder="Your email" 
                  className="newsletter-input" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required 
                />
                <button type="submit" className="newsletter-btn" disabled={isLoading}>
                  {isLoading ? 'Sending...' : 'Subscribe'}
                </button>
              </form>
            )}

          </div>

        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p className="copyright">
              © {currentYear} Tindahan.AI. All rights reserved. Made with 💚 in the Philippines.
            </p>
            <div className="footer-legal">
              <a href="#privacy">Privacy Policy</a>
              <span className="separator">•</span>
              <a href="#terms">Terms of Service</a>
              <span className="separator">•</span>
              <a href="#contact">Contact</a>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;