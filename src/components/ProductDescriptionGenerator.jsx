import React, { useState, useEffect } from 'react';
import { fetchProductDescriptions } from '../services/api';
import './ProductGenerator.css';

const ProductDescriptionGenerator = () => {
  const [productName, setProductName] = useState('');
  const [features, setFeatures] = useState('');
  const [platforms, setPlatforms] = useState(['shopee', 'lazada', 'tiktok']); // All selected by default
  const [descriptions, setDescriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [analytics, setAnalytics] = useState({
    totalGenerations: 0,
    platformUsage: {},
    recentProducts: []
  });

  // Load analytics from localStorage on mount
  useEffect(() => {
    const savedAnalytics = localStorage.getItem('tindahan_analytics');
    if (savedAnalytics) {
      setAnalytics(JSON.parse(savedAnalytics));
    }
  }, []);

  // Save analytics to localStorage
  const saveAnalytics = (newData) => {
    const updated = { ...analytics, ...newData };
    setAnalytics(updated);
    localStorage.setItem('tindahan_analytics', JSON.stringify(updated));
  };

  const handlePlatformToggle = (platform) => {
    if (platforms.includes(platform)) {
      setPlatforms(platforms.filter(p => p !== platform));
    } else {
      setPlatforms([...platforms, platform]);
    }
  };
  
  // Platform info
  const platformInfo = {
    shopee: { name: 'Shopee', icon: '🛍️', color: '#ee4d2d' },
    lazada: { name: 'Lazada', icon: '🏪', color: '#0f156d' },
    tiktok: { name: 'TikTok Shop', icon: '🎵', color: '#000000' }
  };

const handleSubmit = async () => {
    if (!productName.trim()) {
      setError('Please enter a product name');
      return;
    }

    if (platforms.length === 0) {
      setError('Please select at least one platform');
      return;
    }

    setLoading(true);
    setError('');
    setDescriptions([]);

    try {
      // Create platform-specific prompts
      const platformDescriptions = [];
      
      for (const platform of platforms) {
        let prompt = '';
        
        if (platform === 'shopee') {
  prompt = `
You are a Shopee Philippines product copywriter.


STRICT RULES:
Write now:

SECTION 1: ANALYTICAL
(Technical, structured, feature-focused)

SECTION 2: SIMPLIFIED
(Simple, casual, buyer-friendly)

SECTION 3: CRITICAL
(Persuasive, objection-handling, trust-building)

Rules:
- Output ONLY these 3 sections.
- Do not add commentary.
- Do not add extra text.
- Keep each section 3–5 lines.
`;
}
 else if (platform === 'lazada') {
  prompt = `
You are a Lazada (LazMall) official store copywriter.

STRICT RULES:
Write now:

SECTION 1: ANALYTICAL
(Technical, structured, feature-focused)

SECTION 2: SIMPLIFIED
(Simple, casual, buyer-friendly)

SECTION 3: CRITICAL
(Persuasive, objection-handling, trust-building)

Rules:
- Output ONLY these 3 sections.
- Do not add commentary.
- Do not add extra text.
- Keep each section 3–5 lines.
`;
}
 else if (platform === 'tiktok') {
  prompt = `
You are a TikTok Shop product caption writer.

STRICT RULES:
Write now:

SECTION 1: ANALYTICAL
(Technical, structured, feature-focused)

SECTION 2: SIMPLIFIED
(Simple, casual, buyer-friendly)

SECTION 3: CRITICAL
(Persuasive, objection-handling, trust-building)

Rules:
- Output ONLY these 3 sections.
- Do not add commentary.
- Do not add extra text.
- Keep each section 3–5 lines.
`;
}


        const response = await fetchProductDescriptions(prompt);
        
        // Add platform info to each response
        const platformResponse = response.map(desc => ({
          ...desc,
          platform: platform
        }));
        
        platformDescriptions.push(...platformResponse);
      }

      setDescriptions(platformDescriptions);

      // Update Analytics
      const newPlatformUsage = { ...analytics.platformUsage };
      platforms.forEach(platform => {
        newPlatformUsage[platform] = (newPlatformUsage[platform] || 0) + 1;
      });

      const newRecentProducts = [
        {
          name: productName,
          platforms: platforms,
          timestamp: new Date().toISOString(),
          characterCount: platformDescriptions.reduce((sum, d) => sum + d.text.length, 0)
        },
        ...analytics.recentProducts.slice(0, 9) // Keep last 10
      ];

      saveAnalytics({
        totalGenerations: analytics.totalGenerations + 1,
        platformUsage: newPlatformUsage,
        recentProducts: newRecentProducts
      });

    } catch (err) {
      setError('Failed to generate descriptions. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleReset = () => {
    setProductName('');
    setFeatures('');
    setPlatforms(['shopee', 'lazada', 'tiktok']);
    setDescriptions([]);
    setError('');
  };

  const charCount = productName.length + features.length;
  const maxChars = 500;

  

  return (
    <div className="product-generator-section" id="product-generator">
      <div className="product-generator-content">
        
        {/* Header */}
        <div className="generator-header">
          <h2>📦 Product Description Generator</h2>
          <p>Generate unique, platform-optimized descriptions para sa Shopee, Lazada & TikTok Shop!</p>
        </div>

        {/* Input Form */}
        <div className="generator-form">
          
          {/* Product Name */}
          <div className="form-group">
            <label htmlFor="product-name">Ano ang Produkto? *</label>
            <input
              id="product-name"
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g., Wireless Bluetooth Earbuds, Damit Pambahay, Skincare Set"
              className="form-input"
              maxLength={200}
            />
          </div>

          {/* Features */}
          <div className="form-group">
            <label htmlFor="features">Key Features (optional)</label>
            <textarea
              id="features"
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              placeholder="e.g., Noise cancellation, 24-hour battery, waterproof, mabango, matibay"
              className="form-textarea"
              rows={3}
              maxLength={300}
            />
            <div className="char-counter">
              {charCount} / {maxChars} characters
            </div>
          </div>

          {/* Platform Selector - CHECKBOXES */}
          <div className="form-group">
            <label>Saan mo ibebenta? (Select all that apply)</label>
            <div className="platform-checkboxes">
              {Object.entries(platformInfo).map(([key, info]) => (
                <label key={key} className={`platform-checkbox ${platforms.includes(key) ? 'selected' : ''}`}>
                  <input
                    type="checkbox"
                    checked={platforms.includes(key)}
                    onChange={() => handlePlatformToggle(key)}
                  />
                  <span className="checkbox-content">
                    <span className="platform-icon">{info.icon}</span>
                    <span className="platform-name">{info.name}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button 
            onClick={handleSubmit} 
            disabled={loading || !productName.trim() || platforms.length === 0}
            className="generate-button"
          >
            {loading ? '🔄 Ginagawa na...' : '✨ Generate Descriptions'}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="loading-box">
            <div className="loading-spinner"></div>
            <p>Ginagawa ang product descriptions mo...</p>
          </div>
        )}

        {/* Generated Descriptions */}
        {descriptions.length > 0 && (
          <div className="descriptions-grid">
            <div className="results-header">
              <h3>✅ Tapos na! Ito na ang Product Descriptions mo😊</h3>
              <button onClick={handleReset} className="reset-button">
                Generate Another
              </button>
            </div>

            {/* Group by platform */}
            {platforms.map(platform => {
              const platformDescs = descriptions.filter(d => d.platform === platform);
              if (platformDescs.length === 0) return null;

              return (
                <div key={platform} className="platform-group">
                  <h4 className="platform-group-title">
                    {platformInfo[platform].icon} {platformInfo[platform].name}
                  </h4>
                  
                  {platformDescs.map((desc, index) => (
                    <div key={index} className="description-card">
                      <div className="card-header">
                        <div className="card-title">
                          <span className="card-icon">{desc.icon}</span>
                          <div>
                            <h4 style={{ color: desc.color }}>{desc.name}</h4>
                            <p className="card-subtitle">{desc.description}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleCopy(desc.text, `${platform}-${index}`)}
                          className="copy-button"
                        >
                          {copiedIndex === `${platform}-${index}` ? '✓ Copied!' : '📋 Copy'}
                        </button>
                      </div>
                      
                      <div className="description-text">
                        {desc.text}
                      </div>

                      <div className="description-stats">
                        <span className="stat">
                          {desc.text.split(' ').length} words
                        </span>
                        <span className="stat">
                          {desc.text.length} characters
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* Tips Section */}
        {descriptions.length === 0 && !loading && (
          <div className="tips-section">
            <h4>💡 Tips para sa Better Descriptions</h4>
            <ul>
              <li>Include specific details (sukat,kulay,materyal)</li>
              <li>Mention benefits (time-saver,mas maganda,mas matibay)</li>
              <li>Add use cases (perfect for work,travel,regalo)</li>
              <li>Be honest - accurate descriptions = less returns!</li>
              <li>Maglagay ng emojis para eye-catching! ✨</li>
            </ul>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProductDescriptionGenerator;
