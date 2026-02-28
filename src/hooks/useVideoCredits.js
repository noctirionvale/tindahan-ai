// ─────────────────────────────────────────────
// useVideoCredits.js
// Drop this hook into your VideoGenerator.jsx
// to gate generation behind Video Credits.
// ─────────────────────────────────────────────
import { useState } from 'react';
import axios from 'axios';
import { VIDEO_CREDITS_PLAN } from './Pricing';

const API = 'https://tindahan-ai-production.up.railway.app';

export const useVideoCredits = () => {
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditModalMode, setCreditModalMode] = useState('buy'); // 'buy' | 'confirm'
  const [videoCredits, setVideoCredits] = useState(null); // null = not fetched yet
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');

  // Call this before every video generation attempt
  const checkAndPrompt = async (onProceed) => {
    setError('');
    const token = localStorage.getItem('tindahan_token');
    if (!token) {
      setError('Please log in to generate videos.');
      return;
    }

    try {
      // Fetch current credit balance from your backend
      const res = await axios.get(`${API}/api/user/video-credits`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const credits = res.data.videoCredits ?? 0;
      setVideoCredits(credits);

      if (credits <= 0) {
        // No credits — show buy modal
        setCreditModalMode('buy');
        setShowCreditModal(true);
      } else {
        // Has credits — ask if they want to use one
        setCreditModalMode('confirm');
        setShowCreditModal(true);
        // Store callback so confirm button can fire it
        window._videoProceedCallback = onProceed;
      }
    } catch {
      // If endpoint not ready yet, just proceed (remove this fallback later)
      onProceed();
    }
  };

  const handleConfirm = () => {
    setShowCreditModal(false);
    if (window._videoProceedCallback) {
      window._videoProceedCallback();
      window._videoProceedCallback = null;
    }
  };

  const handlePayMongoCheckout = async () => {
    setLoading('paymongo');
    setError('');
    try {
      const token = localStorage.getItem('tindahan_token');
      const response = await axios.post(
        `${API}/api/payment/create-link`,
        { planKey: VIDEO_CREDITS_PLAN.planKey },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        window.location.href = response.data.checkoutUrl;
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create payment. Please try again.');
    } finally {
      setLoading('');
    }
  };

  // The modal JSX — render this anywhere in VideoGenerator's return()
  const CreditModal = () => {
    if (!showCreditModal) return null;

    return (
      <div
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 3000, padding: '1rem'
        }}
        onClick={() => setShowCreditModal(false)}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '20px', padding: '2rem',
            maxWidth: '420px', width: '100%',
            position: 'relative'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setShowCreditModal(false)}
            style={{
              position: 'absolute', top: '1rem', right: '1rem',
              background: 'rgba(255,255,255,0.1)', border: 'none',
              color: '#fff', width: '32px', height: '32px',
              borderRadius: '50%', cursor: 'pointer', fontSize: '16px'
            }}
          >✕</button>

          {creditModalMode === 'confirm' ? (
            // ── User HAS credits — confirm use ──
            <>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎬</div>
                <h2 style={{ color: '#fff', fontSize: '1.3rem', marginBottom: '0.5rem' }}>
                  Use a Video Credit?
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
                  You have <strong style={{ color: '#00e5ff' }}>{videoCredits} credit{videoCredits !== 1 ? 's' : ''}</strong> remaining.
                  This generation will use 1 credit.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setShowCreditModal(false)}
                  style={{
                    flex: 1, padding: '12px',
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '10px', color: '#fff',
                    cursor: 'pointer', fontWeight: 600
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  style={{
                    flex: 2, padding: '12px',
                    background: 'linear-gradient(135deg, #00e5ff, #6a5cff)',
                    border: 'none', borderRadius: '10px', color: '#fff',
                    cursor: 'pointer', fontWeight: 700, fontSize: '1rem'
                  }}
                >
                  ✅ Use 1 Credit & Generate
                </button>
              </div>

              <p style={{ textAlign: 'center', marginTop: '1rem' }}>
                <button
                  onClick={() => setCreditModalMode('buy')}
                  style={{
                    background: 'none', border: 'none',
                    color: 'rgba(255,255,255,0.4)', fontSize: '12px',
                    cursor: 'pointer', textDecoration: 'underline'
                  }}
                >
                  Buy more credits
                </button>
              </p>
            </>
          ) : (
            // ── User has NO credits — show buy flow ──
            <>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎬</div>
                <h2 style={{ color: '#fff', fontSize: '1.3rem', marginBottom: '0.5rem' }}>
                  Video Credits Needed
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                  You have <strong style={{ color: '#ff6b35' }}>0 credits</strong> remaining.
                </p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                  Buy a pack to generate videos — never expires, stackable.
                </p>
              </div>

              <div style={{
                background: 'rgba(0,229,255,0.06)',
                border: '1px solid rgba(0,229,255,0.2)',
                borderRadius: '12px', padding: '1rem',
                marginBottom: '1.25rem', textAlign: 'center'
              }}>
                <div style={{ color: '#00e5ff', fontSize: '1.6rem', fontWeight: 700 }}>₱199</div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                  10 video generations · one-time · stackable
                </div>
              </div>

              {error && (
                <div style={{
                  background: 'rgba(239,68,68,0.15)',
                  border: '1px solid rgba(239,68,68,0.4)',
                  borderRadius: '10px', padding: '10px',
                  color: '#fca5a5', fontSize: '13px',
                  marginBottom: '12px', textAlign: 'center'
                }}>
                  ⚠️ {error}
                </div>
              )}

              <button
                onClick={handlePayMongoCheckout}
                disabled={loading === 'paymongo'}
                style={{
                  width: '100%', padding: '14px',
                  background: 'linear-gradient(135deg, #00c2ff, #0066ff)',
                  border: 'none', borderRadius: '12px',
                  color: '#fff', fontWeight: 700, fontSize: '1rem',
                  cursor: 'pointer', marginBottom: '10px',
                  opacity: loading === 'paymongo' ? 0.7 : 1
                }}
              >
                {loading === 'paymongo' ? '⏳ Creating payment link...' : '💳 Buy 5 Video Credits — ₱199'}
              </button>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '10px' }}>
                {['💙 GCash', '💚 Maya', '💳 Card'].map(m => (
                  <span key={m} style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '20px', padding: '4px 10px',
                    fontSize: '11px', color: 'rgba(255,255,255,0.7)'
                  }}>{m}</span>
                ))}
              </div>

              <p style={{
                textAlign: 'center', color: 'rgba(255,255,255,0.35)',
                fontSize: '11px', margin: 0
              }}>
                🔒 Secured by PayMongo · Activates instantly after payment
              </p>
            </>
          )}
        </div>
      </div>
    );
  };

  return { checkAndPrompt, CreditModal };
};