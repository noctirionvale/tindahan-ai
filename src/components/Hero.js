import React from 'react';

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-inner">
        <div className="hero-visual">
          <img src="hero.ai.png" alt="AI Visual Representation" />
        </div>
        <div className="hero-content">
          <div className="site-title">vAIbes</div>
          <div className="clear-explanations">CLEAR EXPLANATIONS FOR A CHANGING WORLD</div>
          <div className="main-headline">Understanding</div>
          <div className="sub-headline">
            <span className="sub-headline-line1">AI Without Fear</span>
            <span className="sub-headline-line2">or Hype</span>
          </div>
          <p className="hero-desc">
            The logic-smart space for adults who want clear technology explanations without the exaggeration.
          </p>
          <a href="#ai-comparison" className="read-more-btn">Try AI Comparison</a>
        </div>
      </div>
    </section>
  );
};

export default Hero;