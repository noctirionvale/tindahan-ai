import React, { useState, useEffect } from 'react';
import { fetchProductDescriptions } from '../services/api';
import './ProductGenerator.css';

const ProductDescriptionGenerator = () => {
  const [productName, setProductName] = useState('');
  const [features, setFeatures] = useState('');
  const [platforms, setPlatforms] = useState(['shopee', 'lazada', 'tiktok']);
  const [descriptions, setDescriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [analytics, setAnalytics] = useState({
    totalGenerations: 0,
    platformUsage: {},
    recentProducts: []
  });

  // 1. Static Configuration
  const platformInfo = {
    shopee: { name: 'Shopee', icon: '🛍️', color: '#ee4d2d' },
    lazada: { name: 'Lazada', icon: '🏪', color: '#0f156d' },
    tiktok: { name: 'TikTok Shop', icon: '🎵', color: '#000000' }
  };

  // 2. Lifecycle & Persistence
  useEffect(() => {
    const savedAnalytics = localStorage.getItem('tindahan_analytics');
    if (savedAnalytics) {
      setAnalytics(JSON.parse(savedAnalytics));
    }
  }, []);

  const saveAnalytics = (newData) => {
    const updated = { ...analytics, ...newData };
    setAnalytics(updated);
    localStorage.setItem('tindahan_analytics', JSON.stringify(updated));
  };

  // 3. Handlers
  const handlePlatformToggle = (platform) => {
    if (platforms.includes(platform)) {
      setPlatforms(platforms.filter(p => p !== platform));
    } else {
      setPlatforms([...platforms, platform]);
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
      const platformDescriptions = [];

      for (const platform of platforms) {
        let prompt = '';

        if (platform === 'shopee') {
          prompt = `You are a Shopee Philippines product copywriter. Output ONLY the description. Style: Professional Taglish. Format: Product Name + Bullet points. Product: ${productName}. Features: ${features || 'High quality'}`;
        } else if (platform === 'lazada') {
          prompt = `You are a Lazada official copywriter. Style: Corporate English/Taglish. Format: Specs + Benefits. Product: ${productName}. Features: ${features || 'Safe and reliable'}`;
        } else if (platform === 'tiktok') {
          prompt = `You are a TikTok Shop caption writer. Style: Casual/Viral. Product: ${productName}. Features: ${features || 'Trending item'}`;
        }

        const response = await fetchProductDescriptions(prompt);
        const results = Array.isArray(response) ? response : [{ text: response }];

        const platformResponse = results.map(desc => ({
          ...desc,
          platform,
          name: platform === 'shopee' ? 'Shopee Optimized' : 
                platform === 'lazada' ? 'LazMall Standard' : 'TikTok Viral Caption',
          icon: platformInfo[platform].icon,
          color: platformInfo[platform].color
        }));

        platformDescriptions.push(...platformResponse);
      }

      setDescriptions(platformDescriptions);

      // Update Analytics
      const newPlatformUsage = { ...analytics.platformUsage };
      platforms.forEach(p => {
        newPlatformUsage[p] = (newPlatformUsage[p] || 0) + 1;
      });

      const newRecentProducts = [
        {
          name: productName,
          platforms: platforms,
          timestamp: new Date().toISOString(),
          characterCount: platformDescriptions.reduce((sum, d) => sum + (d.text?.length || 0), 0)
        },
        ...analytics.recentProducts.slice(0, 9)
      ];

      saveAnalytics({
        totalGenerations: analytics.totalGenerations + 1,
        platformUsage: newPlatformUsage,
        recentProducts: newRecentProducts
      });

    } catch (err) {
  if (err.message?.includes('limit') || err.message?.includes('upgrade')) {
    setError('🚫 ' + err.message + ' Click "See Pricing" to upgrade!');
  } else {
    setError('Failed to generate. Please check your connection.');
  }
  console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const charCount = productName.length + features.length;
  const maxChars = 500;

  // 4. Render Logic
  return (
    <div className="product-generator-section" id="product-generator">
      <div className="product-generator-content">
        <div className="generator-header">
          <h2>📦 Product Description Generator</h2>
          <p>Generate unique, platform-optimized descriptions para sa Shopee, Lazada & TikTok Shop!</p>
        </div>

        <div className="generator-form">
          <div className="form-group">
            <label htmlFor="product-name">Ano ang Produkto? *</label>
            <input
              id="product-name"
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g., Wireless Bluetooth Earbuds"
              className="form-input"
              maxLength={200}
            />
          </div>

          <div className="form-group">
            <label htmlFor="features">Key Features (optional)</label>
            <textarea
              id="features"
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              placeholder="e.g., Noise cancellation, mabango, matibay"
              className="form-textarea"
              rows={3}
              maxLength={300}
            />
            <div className="char-counter">
              {charCount} / {maxChars} characters
            </div>
          </div>

          <div className="form-group">
            <label>Saan mo ibebenta?</label>
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

          <button 
            onClick={handleSubmit} 
            disabled={loading || !productName.trim() || platforms.length === 0}
            className="generate-button"
          >
            {loading ? '🔄 Ginagawa na...' : '✨ Generate Descriptions'}
          </button>
        </div>

        {error && <div className="error-box">{error}</div>}

        {loading && (
          <div className="loading-box">
            <div className="loading-spinner"></div>
            <p>Ginagawa ang product descriptions mo...</p>
          </div>
        )}

        {descriptions.length > 0 && (
          <div className="descriptions-grid">
            <div className="results-header">
              <h3>✅ Tapos na! Your Product Descriptions</h3>
              <button onClick={handleReset} className="reset-button">Generate Another</button>
            </div>

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
                      <div className="description-text">{desc.text}</div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDescriptionGenerator;