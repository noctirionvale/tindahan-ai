import React, { useState, useEffect } from 'react';
import './Pricing.css';

const EXCHANGE_RATES = {
  PHP: 1,
  USD: 0.017,
  CNY: 0.12,
  NGN: 27.5
};

const CURRENCY_SYMBOLS = {
  PHP: '₱',
  USD: '$',
  CNY: '¥',
  NGN: '₦'
};

const Pricing = () => {
  const [currency, setCurrency] = useState('PHP');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Auto-detect currency based on browser language
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
      '1 lifetime video generation',
      '1 lifetime voice generation',
      'All 6 platform formats',
      'Copy to clipboard',
      'Basic support'
    ],
    cta: 'Start Free',
    popular: false,
    color: '#64748b',
    planKey: 'free'
  },
  {
    name: 'Starter',
    phpPrice: 299,
    period: 'per month',
    description: 'For small sellers testing video ads',
    features: [
      '100 description generations/month',
      '10 video generations/month',
      '10 voice generations/month',
      'All 6 platform formats',
      'Generation history',
      'Priority support'
    ],
    cta: 'Upgrade Now',
    popular: true,
    color: '#ff6b35',
    planKey: 'starter'
  },
  {
    name: 'Pro',
    phpPrice: 599,
    period: 'per month',
    description: 'For active sellers & affiliates',
    features: [
      '300 description generations/month',
      '30 video generations/month',
      '30 voice generations/month',
      'All 6 platform formats',
      'Analytics dashboard',
      'Export to CSV',
      'Priority support'
    ],
    cta: 'Upgrade Now',
    popular: false,
    color: '#8b5cf6',
    planKey: 'pro'
  },
  {
    name: 'Business',
    phpPrice: 999,
    period: 'per month',
    description: 'For power sellers & growing shops',
    features: [
      '800 description generations/month',
      '80 video generations/month',
      '80 voice generations/month',
      'All 6 platform formats',
      'Bulk generation',
      'Analytics dashboard',
      'Custom templates',
      'Priority support'
    ],
    cta: 'Upgrade Now',
    popular: false,
    color: '#22c55e',
    planKey: 'business'
  }
];
  const handleUpgradeClick = (plan) => {
    if (plan.planKey === 'free') {
      window.location.href = '#product-generator';
      return;
    }
    setSelectedPlan(plan);
    setShowUpgradeModal(true);
  };

  return (
    <section id="pricing" className="pricing-section">
      <div className="pricing-content">

        <div className="pricing-header">
          <h2>Simple, Transparent Pricing</h2>
          <p>Start free. Scale as you grow. Cancel anytime.</p>

          {/* Currency Switcher */}
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
            <div key={index} className={`pricing-card ${plan.popular ? 'popular' : ''}`}>
              {plan.popular && <div className="popular-badge">⭐ Most Popular</div>}

              <div className="plan-header">
                <h3>{plan.name}</h3>
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

      {/* Upgrade Modal */}
      {showUpgradeModal && selectedPlan && (
        <div className="modal-overlay" onClick={() => setShowUpgradeModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowUpgradeModal(false)}>✕</button>

            <div className="modal-header">
              <h2>Upgrade to {selectedPlan.name} 🚀</h2>
              <p className="modal-price">
                {convertPrice(selectedPlan.phpPrice)}
                <span>/month</span>
              </p>
              {currency !== 'PHP' && (
                <p className="modal-php">≈ ₱{selectedPlan.phpPrice.toLocaleString()} PHP</p>
              )}
            </div>

            {/* Filipino Payment */}
            <div className="payment-section ph-payment">
              <p>Scan the QR code below with your GCash app:</p>
              <div className="gcash-qr-wrapper">
              <img src="/gcash-qr.jpg" alt="GCash QR Code" className="gcash-qr" />
              </div>
              <div className="payment-steps">
                <div className="step">Email proof of payment + your account email to:</div>
                <a
                  href={`mailto:noctirionvale@gmail.com?subject=Tindahan.AI ${selectedPlan.name} Upgrade&body=Hi! I just paid for the ${selectedPlan.name} plan (₱${selectedPlan.phpPrice}/month). My Tindahan.AI account email is: [YOUR EMAIL HERE]. Please upgrade my account. Thank you!`}
                  className="email-button"
                >
                  📧 noctirionvale@gmail.com
                </a>
                <p className="upgrade-note">⏱️ Account upgraded within 24 hours!</p>
              </div>
            </div>

            {/* Divider */}
            <div className="payment-divider">
              <span>OR</span>
            </div>

            {/* International Payment */}
            <div className="payment-section intl-payment">
              <h3>🌍 International Users</h3>
              <p>Card payment coming soon! For now, please contact us:</p>
              <a
                href={`mailto:spawntaneousbulb@gmail.com?subject=Tindahan.AI ${selectedPlan.name} Upgrade (International)&body=Hi! I want to upgrade to the ${selectedPlan.name} plan. My account email is: [YOUR EMAIL HERE]. Please send payment instructions. Thank you!`}
                className="email-button intl"
              >
                📧 Contact Us to Upgrade
              </a>
            </div>

          </div>
        </div>
      )}

    </section>
  );
};

export default Pricing;