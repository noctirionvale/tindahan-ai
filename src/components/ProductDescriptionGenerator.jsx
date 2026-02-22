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

  const platformInfo = {
    shopee: { name: 'Shopee', icon: '🛍️', color: '#ee4d2d' },
    lazada: { name: 'Lazada', icon: '🏪', color: '#0f156d' },
    tiktok: { name: 'TikTok Shop', icon: '🎵', color: '#000000' },
    amazon: { name: 'Amazon', icon: '📦', color: '#ff9900' },
    facebook: { name: 'Facebook Marketplace', icon: '👥', color: '#4267B2' },
    ebay: { name: 'eBay', icon: '🏷️', color: '#0064d2' }
  };

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
        } else if (platform === 'amazon') {
          prompt = `You are an Amazon listing expert. Output ONLY the listing. Style: Professional English. Format: Title + 5 bullet points + short description. SEO optimized. Product: ${productName}. Features: ${features || 'High quality product'}`;
        } else if (platform === 'facebook') {
          prompt = `You are a Facebook seller. Output ONLY the listing. Style: Warm, conversational. Format: Catchy title + description. Product: ${productName}. Features: ${features || 'Great item'}`;
        } else if (platform === 'ebay') {
          prompt = `You are an eBay listing expert. Output ONLY the listing. Style: Clear, factual, buyer-focused English. Format: Title + condition + description + why buy from us. Product: ${productName}. Features: ${features || 'Quality item'}`;
        }

        const response = await fetchProductDescriptions(prompt);
        const results = Array.isArray(response) ? response : [{ text: response }];

        const platformResponse = results.map(desc => ({
          ...desc,
          platform,
          name: platformInfo[platform].name,
          icon: platformInfo[platform].icon,
          color: platformInfo[platform].color
        }));

        platformDescriptions.push(...platformResponse);
      }

      setDescriptions(platformDescriptions);

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
        setError('🚫 ' + err.message + ' Click "Pricing" to upgrade!');
      } else {
        setError('Failed to generate. Please check your connection.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gen-wrapper">
      <div className="gen-split">
        {/* LEFT: Form */}
        <div className="gen-form-panel">
          <h2 className="gen-title">📦 Generate Descriptions</h2>
          
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Product name..."
            className="gen-input"
          />

          <textarea
            value={features}
            onChange={(e) => setFeatures(e.target.value)}
            placeholder="Features (optional)..."
            className="gen-textarea"
            rows={2}
          />

          <div className="gen-platforms">
            {Object.entries(platformInfo).map(([key, info]) => (
              <label key={key} className={`gen-platform ${platforms.includes(key) ? 'active' : ''}`}>
                <input
                  type="checkbox"
                  checked={platforms.includes(key)}
                  onChange={() => handlePlatformToggle(key)}
                />
                <span>{info.icon}</span>
              </label>
            ))}
          </div>

          <button 
            onClick={handleSubmit} 
            disabled={loading || !productName.trim()}
            className="gen-btn"
          >
            {loading ? '🔄 Generating...' : '✨ Generate'}
          </button>

          {error && <div className="gen-error">{error}</div>}
        </div>

        {/* RIGHT: Results */}
        <div className="gen-results-panel">
          {loading && (
            <div className="gen-loading">
              <div className="loading-spinner"></div>
              <p>Creating descriptions...</p>
            </div>
          )}

          {!loading && descriptions.length === 0 && (
            <div className="gen-empty">
              <div className="gen-empty-icon">✨</div>
              <p>Your descriptions will appear here</p>
            </div>
          )}

          {descriptions.length > 0 && (
            <>
              <div className="gen-results-header">
                <h3>Results</h3>
                <button onClick={handleReset} className="gen-reset">New</button>
              </div>
              
              <div className="gen-results-scroll">
                {platforms.map(platform => {
                  const platformDescs = descriptions.filter(d => d.platform === platform);
                  if (platformDescs.length === 0) return null;

                  return (
                    <div key={platform} className="gen-result-group">
                      <h4 className="gen-result-title">
                        {platformInfo[platform].icon} {platformInfo[platform].name}
                      </h4>
                      {platformDescs.map((desc, index) => (
                        <div key={index} className="gen-result-card">
                          <div className="gen-result-text">{desc.text}</div>
                          <button 
                            onClick={() => handleCopy(desc.text, `${platform}-${index}`)}
                            className="gen-copy-btn"
                          >
                            {copiedIndex === `${platform}-${index}` ? '✓' : '📋'}
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDescriptionGenerator;