import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Pricing.css';

const API = 'https://tindahan-ai-production.up.railway.app';

const EXCHANGE_RATES = { PHP: 1, USD: 0.017, CNY: 0.12, NGN: 27.5 };
const CURRENCY_SYMBOLS = { PHP: '₱', USD: '$', CNY: '¥', NGN: '₦' };

// ── Exported so VideoGenerator (and PackageGenerator) can import and
//    trigger the buy modal without going through the Pricing page ──
export const VIDEO_CREDITS_PLAN = {
  name: 'Image-Video Credits',
  phpPrice: 199,
  period: 'one-time',
  description: 'Pay-as-you-go video generations. Never expires.',
  features: [
    '5 video generations per pack',
    'Never expires — use anytime',
    'Instant activation'
  ],
  cta: 'Buy Credits',
  popular: false,
  isCredits: true,           // flag used by VideoGenerator
  color: '#00e5ff',
  planKey: 'video_credits'
};

const Pricing = () => {
  const [currency, setCurrency] = useState('PHP');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const lang = navigator.language || 'en-PH';
    if (lang.includes('zh')) setCurrency('CNY');
    else if (lang.includes('en-US') || lang.includes('en-us')) setCurrency('USD');
    else if (lang.includes('en-NG') || lang.includes('ha') || lang.includes('yo')) setCurrency('NGN');
    else setCurrency('PHP');
  }, []);

  const convertPrice = (phpPrice) => {
    const rate = EXCHANGE_RATES[currency];
    const converted = phpPrice * rate;
    if (currency === 'PHP') return `₱${phpPrice.toLocaleString()}`;
    if (currency === 'USD') return `$${converted.toFixed(2)}`;
    if (currency === 'CNY') return `¥${converted.toFixed(0)}`;
    if (currency === 'NGN') return `₦${Math.round(converted).toLocaleString()}`;
    return `${converted.toFixed(2)}`;
  };

  const plans = [
    {
      name: 'Free',
      phpPrice: 0,
      period: 'forever',
      description: 'Try Tindahan.AI - no credit card needed!',
      features: [
        '15 lifetime description generations',
        '2 lifetime voice generations',
        'Copy to clipboard',
        'Basic support'
      ],
      cta: 'Start Free',
      popular: false,
      color: '#64748b',
      planKey: 'free'
    },
    {
      name: 'Pro',
      phpPrice: 399,
      period: 'per month',
      description: 'For small sellers testing video ads',
      features: [
        '200 description generations/month',
        '30 voice generations/month',
        'All 6 platform formats',
        'Video credits sold separately',
        'Flexible PAYG pricing',
        'Priority support'
      ],
      cta: 'Upgrade Now',
      popular: true,
      color: '#ff6b35',
      planKey: 'starter'
    },
    {
      name: 'Business',
      phpPrice: 699,
      period: 'per month',
      description: 'For active sellers & affiliates',
      features: [
        '500 description generations/month',
        '80 voice generations/month',
        'All 6 platform formats',
        'Analytics dashboard',
        'Video credits sold separately',
        'Flexible PAYG pricing',
        'Priority support'
      ],
      cta: 'Upgrade Now',
      popular: false,
      color: '#8b5cf6',
      planKey: 'pro'
    },
    // 4th card — Video Credits
    VIDEO_CREDITS_PLAN,
  ];

  const handleUpgradeClick = (plan) => {
    if (plan.planKey === 'free') {
      window.location.href = '#product-generator';
      return;
    }
    setError('');
    setSelectedPlan(plan);
    setShowUpgradeModal(true);
  };

  const handlePayMongoCheckout = async () => {
    setLoading('paymongo');
    setError('');
    try {
      const token = localStorage.getItem('tindahan_token');
      if (!token) {
        setError('Please log in to continue.');
        return;
      }

      const response = await axios.post(
        `${API}/api/payment/create-link`,
        { planKey: selectedPlan.planKey },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.success) {
        window.location.href = response.data.checkoutUrl;
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create payment. Please try again.');
      console.error('Payment error:', err);
    } finally {
      setLoading('');
    }
  };

  // ── Modal label differs for credits vs subscription plans ──
  const modalTitle = selectedPlan?.isCredits
    ? `Buy Video Credits 🎬`
    : `Upgrade to ${selectedPlan?.name} 🚀`;

  const modalPayLabel = selectedPlan?.isCredits
    ? `💳 Pay ${convertPrice(selectedPlan?.phpPrice)} — Get 5 Videos`
    : `💳 Pay ₱${selectedPlan?.phpPrice?.toLocaleString()}/month`;

  return (
    <section id="pricing" className="pricing-section">
      <div className="pricing-content">

        <div className="pricing-header">
          <h2>Simple, Transparent Pricing</h2>
          <p>Start free. Scale as you grow. Cancel anytime.</p>

          <div className="currency-switcher">
            <span className="currency-label">💱 Currency:</span>
            {Object.keys(EXCHANGE_RATES).map((curr) => (
              <button
                key={curr}
                onClick={() => setCurrency(curr)}
                className={`currency-btn ${currency === curr ? 'active' : ''}`}
              >
                {CURRENCY_SYMBOLS[curr]} {curr}
              </button>
            ))}
          </div>
        </div>

        <div className="pricing-grid">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`pricing-card ${plan.popular ? 'popular' : ''} ${plan.isCredits ? 'credits-card' : ''}`}
            >
              {plan.popular && <div className="popular-badge">⭐ Most Popular</div>}
              {plan.isCredits && <div className="credits-badge">🎬 Pay As You Go</div>}

              <div className="plan-header">
                <h3 style={{ color: plan.color }}>{plan.name}</h3>
                <div className="plan-price">
                  <span className="price">
                    {plan.phpPrice === 0 ? '₱0' : convertPrice(plan.phpPrice)}
                  </span>
                  <span className="period">/{plan.period}</span>
                </div>
                {currency !== 'PHP' && plan.phpPrice > 0 && (
                  <div className="php-equivalent">≈ ₱{plan.phpPrice.toLocaleString()} PHP</div>
                )}
                <p className="plan-description">{plan.description}</p>
              </div>

              <ul className="features-list">
                {plan.features.map((feature, idx) => (
                  <li key={idx}>
                    <span className="check-icon" style={{ color: plan.color }}>✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgradeClick(plan)}
                className={`plan-cta ${plan.phpPrice > 0 ? 'primary' : 'secondary'}`}
                style={plan.phpPrice > 0 ? { background: `linear-gradient(135deg, ${plan.color}, #ff8c42)` } : {}}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

      </div>

      {/* ── Upgrade / Credits Modal ── */}
      {showUpgradeModal && selectedPlan && (
        <div className="modal-overlay" onClick={() => setShowUpgradeModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowUpgradeModal(false)}>✕</button>

            <div className="modal-header">
              <h2>{modalTitle}</h2>
              <p className="modal-price">
                {convertPrice(selectedPlan.phpPrice)}
                <span>/{selectedPlan.period}</span>
              </p>
              {currency !== 'PHP' && (
                <p className="modal-php">≈ ₱{selectedPlan.phpPrice.toLocaleString()} PHP</p>
              )}
              {selectedPlan.isCredits && (
                <p className="modal-credits-note">10 video generations · never expires · stackable</p>
              )}
            </div>

            {error && <div className="payment-error">⚠️ {error}</div>}

            <div className="payment-section">
              <p className="payment-desc">
                Pay securely via <strong>GCash</strong>, <strong>Maya</strong>, or <strong>Credit/Debit Card</strong>
              </p>

              <div className="payment-logos">
                <span className="payment-logo">💙 GCash</span>
                <span className="payment-logo">💚 Maya</span>
                <span className="payment-logo">💳 Card</span>
              </div>

              <button
                className="paymongo-btn"
                onClick={handlePayMongoCheckout}
                disabled={loading === 'paymongo'}
              >
                {loading === 'paymongo' ? '⏳ Creating payment link...' : modalPayLabel}
              </button>

              <p className="payment-note">
                🔒 Secured by PayMongo · Activates automatically after payment
              </p>
            </div>

            <div className="payment-divider"><span>Need help?</span></div>

            <div className="payment-section contact-section">
              <p>Having trouble paying? Contact us:</p>
              <a
                href={`mailto:noctirionvale@gmail.com?subject=Tindahan.AI ${selectedPlan.name}&body=Hi! I want to get the ${selectedPlan.name} (₱${selectedPlan.phpPrice}). My account email is: [YOUR EMAIL]. Thank you!`}
                className="email-button"
              >
                📧 noctirionvale@gmail.com
              </a>
            </div>

          </div>
        </div>
      )}

    </section>
  );
};

export default Pricing;