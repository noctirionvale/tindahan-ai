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
        
        // CLEAN TEMPLATE - No funny descriptions!
        const basePrompt = `You are a product description writer for ${platform.toUpperCase()}.

STRICT RULES:
- Output ONLY the product description.
- DO NOT explain your thinking.
- DO NOT include perspectives, analysis, or commentary.
- DO NOT use headings like "Analytical Perspective" or "SEO-Focused".
- DO NOT mention AI.
- DO NOT include markdown formatting (no ### or **).
- Keep it concise and sales-focused.

STYLE:
- English-dominant with natural Tagalog accents (kung kailangan).
- Professional, clear, and trustworthy.
- Optimized for Filipino online shoppers.
- Bullet-point format only.

CONTENT:
- Focus on benefits and key features.
- Avoid medical or exaggerated claims.
- Avoid unnecessary adjectives.
- No fluff or over-the-top language.

FORMAT:
Product Name (1 line)
• Bullet list of 5-7 key features/benefits
• Short closing line with trust signal (official store / sealed / authentic / COD available)

Now write a product description for:
Product: ${productName}
${features ? `Features: ${features}` : ''}`;

        if (platform === 'shopee') {
          prompt = basePrompt + `

Platform-specific notes for Shopee:
- Include trust signals like "COD available" or "Official store"
- Mention Free shipping if applicable
- Keep professional but friendly`;
        } else if (platform === 'lazada') {
          prompt = basePrompt + `

Platform-specific notes for Lazada:
- More formal and specification-focused
- Include warranty/guarantee if applicable
- Emphasize authenticity`;
        } else if (platform === 'tiktok') {
          prompt = basePrompt + `

Platform-specific notes for TikTok Shop:
- Shorter (5 bullets max)
- Gen Z/Millennial friendly but still professional
- Add trending appeal without being cringe`;
        }

        const response = await fetchProductDescriptions(prompt);
        
        // Add platform info and labels
        const platformResponse = response.map((desc, index) => ({
          ...desc,
          platform: platform,
          name: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Description`,
          description: 'Clean, professional, ready to use',
          icon: platform === 'shopee' ? '🛍️' : platform === 'lazada' ? '🏪' : '🎵',
          color: platform === 'shopee' ? '#ee4d2d' : platform === 'lazada' ? '#0f156d' : '#000000'
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
        ...analytics.recentProducts.slice(0, 9)
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

  const platformInfo = {
    shopee: { name: 'Shopee', icon: '🛍️', color: '#ee4d2d' },
    lazada: { name: 'Lazada', icon: '🏪', color: '#0f156d' },
    tiktok: { name: 'TikTok Shop', icon: '🎵', color: '#000000' }
  };

  return (
    <div className="product-generator-section" id="product-generator">
      <div className="product-generator-content">
        
        <div className="generator-header">
          <h2>📦 Product Description Generator</h2>
          <p>Generate professional, ready-to-use descriptions para sa Shopee, Lazada & TikTok Shop!</p>
        </div>

        <div className="generator-form">
          
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

          <button 
            onClick={handleSubmit} 
            disabled={loading || !productName.trim() || platforms.length === 0}
            className="generate-button"
          >
            {loading ? '🔄 Ginagawa na...' : '✨ Generate Descriptions'}
          </button>
        </div>

        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        {loading && (
          <div className="loading-box">
            <div className="loading-spinner"></div>
            <p>Creating professional product descriptions...</p>
          </div>
        )}

        {descriptions.length > 0 && (
          <div className="descriptions-grid">
            <div className="results-header">
              <h3>✅ Tapos na! Your Product Descriptions</h3>
              <button onClick={handleReset} className="reset-button">
                Generate Another
              </button>
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

        {descriptions.length === 0 && !loading && (
          <div className="tips-section">
            <h4>💡 Tips para sa Better Descriptions</h4>
            <ul>
              <li>Be specific - include size, color, material</li>
              <li>Focus on benefits, not just features</li>
              <li>Mention use cases (work, travel, gifts)</li>
              <li>Be honest to reduce returns</li>
              <li>Add trust signals (official, sealed, COD)</li>
            </ul>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProductDescriptionGenerator;