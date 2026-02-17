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
        '15 lifetime generations',
        'Product description generator',
        'Shopee, Lazada & TikTok formats',
        'Amazon, Etsy & eBay formats',
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
      phpPrice: 995,
      period: 'per month',
      description: 'For active sellers who need more content',
      features: [
        '200 generations per month',
        'All 6 platform formats',
        'Generation history',
        'Export to CSV',
        'Priority email support',
        'No watermarks'
      ],
      cta: 'Upgrade Now',
      popular: true,
      color: '#ff6b35',
      planKey: 'starter'
    },
    {
      name: 'Premium',
      phpPrice: 5000,
      period: 'per month',
      description: 'For power sellers & agencies',
      features: [
        'Unlimited generations',
        'All 6 platform formats',
        'Video script generator (coming soon)',
        'Bulk product generation',
        'Analytics dashboard',
        'API access',
        'Team collaboration (coming soon)',
        'White-label option (coming soon)',
        'Dedicated support'
      ],
      cta: 'Upgrade Now',
      popular: false,
      color: '#8b5cf6',
      planKey: 'premium'
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
          <div className="pricing-badge">🇵🇭 Made for Filipino Sellers</div>

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
                className={`plan-cta ${plan.popular ? 'primary' : 'secondary'}`}
                style={plan.popular ? { background: `linear-gradient(135deg, ${plan.color}, #ff8c42)` } : {}}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Coming Soon */}
        <div className="coming-soon-banner">
          <h3>🚀 Coming Soon</h3>
          <div className="coming-soon-grid">
            <div className="coming-soon-item"><span>🎬</span><p>Video Script Generator</p></div>
            <div className="coming-soon-item"><span>📊</span><p>Analytics Dashboard</p></div>
            <div className="coming-soon-item"><span>🤖</span><p>AI Image Generator</p></div>
            <div className="coming-soon-item"><span>📱</span><p>Mobile App</p></div>
          </div>
        </div>

        {/* FAQ */}
        <div className="pricing-faq">
          <h3>Frequently Asked Questions</h3>
          <div className="faq-grid">
            <div className="faq-item">
              <h4>How many free generations do I get?</h4>
              <p>You get 15 lifetime free generations - no time limit! Use them whenever you want.</p>
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
                  href={`mailto:spawntaneousbulb@gmail.com?subject=Tindahan.AI ${selectedPlan.name} Upgrade&body=Hi! I just paid for the ${selectedPlan.name} plan (₱${selectedPlan.phpPrice}/month). My Tindahan.AI account email is: [YOUR EMAIL HERE]. Please upgrade my account. Thank you!`}
                  className="email-button"
                >
                  📧 spawntaneousbulb@gmail.com
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