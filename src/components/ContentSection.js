import React from 'react';

const ContentSection = () => {
  return (
    <div className="content-grid">
      <div className="content-card">
        <div className="card-title">WHAT IS AI?</div>
        <p className="muted">A comprehensive guide to understanding AI from the ground up.</p>
      </div>
      <div className="content-card">
        <div className="card-title">FEATURED TOPIC</div>
        <p className="muted">Latest developments and trends in artificial intelligence.</p>
      </div>
      <div className="content-card">
        <div className="card-title">POPULAR TOOLS</div>
        <p className="muted">Discover the platforms shaping the future of technology.</p>
      </div>
    </div>
  );
};

export default ContentSection;