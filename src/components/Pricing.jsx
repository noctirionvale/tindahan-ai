import React from 'react';
import './Pricing.css';

const Pricing = () => {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for trying out tindahan.ai',
      features: [
        '5 generations per day',
        'All tools access',
        'Basic support',
        'Community access'
      ],
      cta: 'Start Free',
      ctaLink: '#product-generator',
      popular: false
    },
    {
      name: 'Starter',
      price: '$19',
      period: 'per month',
      description: 'For serious sellers & creators',
      features: [
        '50 generations per day',
        'All tools access',
        'Priority support',
        'Save generation history',
        'Export to CSV',
        'No watermarks'
      ],
      cta: 'Start 7-Day Trial',
      ctaLink: '#',
      popular: true
    },
    {
      name: 'Pro',
      price: '$49',
      period: 'per month',
      description: 'For teams and agencies',
      features: [
        '200 generations per day',
        'All tools access',
        'Priority support',
        'Team collaboration',
        'API access',
        'Custom templates',
        'Analytics dashboard'
      ],
      cta: 'Start 7-Day Trial',
      ctaLink: '#',
      popular: false
    },
    {
      name: 'Business',
      price: '$99',
      period: 'per month',
      description: 'For scaling businesses',
      features: [
        'Unlimited generations',
        'All tools access',
        'Dedicated support',
        'White-label option',
        'Custom AI training',
        'SLA guarantee',
        'Custom integrations'
      ],
      cta: 'Contact Sales',
      ctaLink: '#',
      popular: false
    }
  ];

  return (
    <section id="pricing" className="pricing-section">
      <div className="pricing-content">
        
        <div className="pricing-header">
          <h2>Simple, Transparent Pricing</h2>
          <p>Start free. Scale as you grow. Cancel anytime.</p>
        </div>

        <div className="pricing-grid">
          {plans.map((plan, index) => (
            <div 
              key={index} 
              className={`pricing-card ${plan.popular ? 'popular' : ''}`}
            >
              {plan.popular && (
                <div className="popular-badge">⭐ Most Popular</div>
              )}
              
              <div className="plan-header">
                <h3>{plan.name}</h3>
                <div className="plan-price">
                  <span className="price">{plan.price}</span>
                  <span className="period">/{plan.period}</span>
                </div>
                <p className="plan-description">{plan.description}</p>
              </div>

              <ul className="features-list">
                {plan.features.map((feature, idx) => (
                  <li key={idx}>
                    <span className="check-icon">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <a 
                href={plan.ctaLink} 
                className={`plan-cta ${plan.popular ? 'primary' : 'secondary'}`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>

        <div className="pricing-faq">
          <h3>Frequently Asked Questions</h3>
          <div className="faq-grid">
            <div className="faq-item">
              <h4>Can I cancel anytime?</h4>
              <p>Yes! Cancel anytime with one click. No questions asked.</p>
            </div>
            <div className="faq-item">
              <h4>What happens after my trial?</h4>
              <p>You'll be charged only if you don't cancel. We'll send you a reminder before.</p>
            </div>
            <div className="faq-item">
              <h4>Do you offer refunds?</h4>
              <p>Yes! 30-day money-back guarantee on all paid plans.</p>
            </div>
            <div className="faq-item">
              <h4>Can I upgrade or downgrade?</h4>
              <p>Absolutely! Change plans anytime and we'll prorate the difference.</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Pricing;