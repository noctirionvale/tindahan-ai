import React, { useState } from 'react'; // Removed useEffect
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

  const platformInfo = {
    shopee: { name: 'Shopee', icon: '🛍️', color: '#ee4d2d' },
    lazada: { name: 'Lazada', icon: '🏪', color: '#0f156d' },
    tiktok: { name: 'TikTok Shop', icon: '🎵', color: '#000000' },
    amazon: { name: 'Amazon', icon: '📦', color: '#ff9900' },
    facebook: { name: 'Facebook Marketplace', icon: '👥', color: '#4267B2' },
    ebay: { name: 'eBay', icon: '🏷️', color: '#0064d2' }
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
    <div className="desc-wrapper">
      <div className="desc-split">
        {/* LEFT: Form Panel */}
        <div className="desc-form-panel">
          <h2 className="desc-title">📝 Generate Descriptions</h2>

          {/* Product Details Section */}
          <div className="desc-section">
            <div className="desc-section-header">
              <h3>PRODUCT DETAILS</h3>
              <span>Required for generation</span>
            </div>

            <div className="desc-input-group">
              <label>Product Name *</label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g., Wireless Bluetooth Earbuds"
                className="desc-input"
              />
            </div>

            <div className="desc-input-group">
              <label>Features (Optional)</label>
              <textarea
                value={features}
                onChange={(e) => setFeatures(e.target.value)}
                placeholder="e.g., Noise cancellation, 20-hour battery, waterproof..."
                className="desc-textarea"
                rows="3"
              />
            </div>
          </div>

          {/* Platforms Section */}
          <div className="desc-section">
            <div className="desc-section-header">
              <h3>SELECT PLATFORMS</h3>
              <span>{platforms.length} selected</span>
            </div>

            <div className="desc-platform-grid">
              {Object.entries(platformInfo).map(([key, info]) => (
                <button
                  key={key}
                  onClick={() => handlePlatformToggle(key)}
                  className={`desc-platform-btn ${platforms.includes(key) ? 'active' : ''}`}
                  style={platforms.includes(key) ? { 
                    background: `linear-gradient(135deg, ${info.color}, #6a5cff)`,
                    borderColor: info.color
                  } : {}}
                >
                  <span>{info.icon}</span>
                  {info.name}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button 
            onClick={handleSubmit} 
            disabled={loading || !productName.trim() || platforms.length === 0}
            className="desc-generate-btn"
          >
            {loading ? '🔄 Generating...' : '✨ Generate Descriptions'}
          </button>

          {/* Loading State */}
          {loading && (
            <div className="desc-generating">
              <div className="desc-spinner"></div>
              <p>Creating descriptions...</p>
              <p className="desc-hint">This may take a few seconds</p>
            </div>
          )}

          {/* Error Message */}
          {error && !loading && (
            <div className="desc-error">
              {error}
              {error.includes('upgrade') && (
                <a href="#pricing" className="desc-upgrade-link">Upgrade Now →</a>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: Results Panel */}
        <div className="desc-results-panel">
          {loading && (
            <div className="desc-empty">
              <div className="desc-spinner"></div>
              <p>Generating your descriptions...</p>
            </div>
          )}

          {!loading && descriptions.length === 0 && (
            <div className="desc-empty">
              <div className="desc-empty-icon">📝</div>
              <p>Your descriptions will appear here</p>
            </div>
          )}

          {descriptions.length > 0 && (
            <>
              <div className="desc-results-header">
                <h3>Generated Descriptions</h3>
                <button onClick={handleReset} className="desc-reset-btn">
                  New Generation
                </button>
              </div>
              
              <div className="desc-results-scroll">
                {platforms.map(platform => {
                  const platformDescs = descriptions.filter(d => d.platform === platform);
                  if (platformDescs.length === 0) return null;

                  return (
                    <div key={platform} className="desc-group">
                      <h4 className="desc-group-title">
                        <span>{platformInfo[platform].icon}</span>
                        {platformInfo[platform].name}
                      </h4>
                      
                      {platformDescs.map((desc, index) => (
                        <div key={index} className="desc-card">
                          <p className="desc-text">{desc.text}</p>
                          <button 
                            onClick={() => handleCopy(desc.text, `${platform}-${index}`)}
                            className="desc-copy-btn"
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