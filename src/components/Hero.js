import React from 'react';

const Hero = () => {
  // Smooth scroll to Product Description Generator
  const scrollToGenerator = () => {
    const generatorSection = document.getElementById('product-generator');
    if (generatorSection) {
      generatorSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <section className="hero">
      <div className="hero-inner">
        <div className="hero-visual">
          <img src="hero.ai.png" alt="AI Tools for Business" />
        </div>
        
        <div className="hero-text">
          <div className="site-title">TINDAHAN.AI</div>
          <div className="clear-explanations">AI TOOLS FOR PINOY SELLERS & CREATORS</div>
          
          <h1 className="main-headline">Create. Sell.</h1>
          <h2 className="sub-headline">
            <span className="sub-headline-line1">Grow. Faster.</span>
          </h2>
          
          <p className="hero-desc">
            Generate product descriptions and video scripts in seconds. 
            Save hours every week with AI-powered content creation.
          </p>
          
          <div className="hero-cta-group">
            <button 
              onClick={scrollToGenerator}
              className="read-more-btn primary"
            >
              Try Free Now
            </button>
            <a href="#pricing" className="read-more-btn secondary">
              See Pricing
            </a>
          </div>

          <div className="hero-trust">
            <p className="trust-text">✨ No credit card required • 5 free generations daily</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;