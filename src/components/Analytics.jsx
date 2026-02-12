import React, { useState, useEffect } from 'react';
import './Analytics.css';

const Analytics = () => {
  const [analytics, setAnalytics] = useState({
    totalGenerations: 0,
    platformUsage: {},
    recentProducts: []
  });

  useEffect(() => {
    // Load analytics from localStorage
    const loadAnalytics = () => {
      const saved = localStorage.getItem('tindahan_analytics');
      if (saved) {
        setAnalytics(JSON.parse(saved));
      }
    };

    loadAnalytics();
    
    // Refresh every 5 seconds
    const interval = setInterval(loadAnalytics, 5000);
    return () => clearInterval(interval);
  }, []);

  // Calculate stats
  const totalPlatformUses = Object.values(analytics.platformUsage).reduce((sum, count) => sum + count, 0);
  const mostUsedPlatform = Object.entries(analytics.platformUsage).sort((a, b) => b[1] - a[1])[0];
  const totalCharacters = analytics.recentProducts.reduce((sum, p) => sum + (p.characterCount || 0), 0);
  const avgCharactersPerProduct = analytics.recentProducts.length > 0 
    ? Math.round(totalCharacters / analytics.recentProducts.length)
    : 0;

  // Estimate time saved (assume 5 mins per manual description)
  const timeSavedMinutes = analytics.totalGenerations * 5;
  const timeSavedHours = Math.floor(timeSavedMinutes / 60);

  const platformNames = {
    shopee: '🛍️ Shopee',
    lazada: '🏪 Lazada',
    tiktok: '🎵 TikTok Shop'
  };

  return (
    <div className="analytics-section" id="analytics">
      <div className="analytics-content">
        
        <div className="analytics-header">
          <h2>📊 Your Analytics Dashboard</h2>
          <p>Track your content creation performance</p>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          
          {/* Total Generations */}
          <div className="stat-card primary">
            <div className="stat-icon">🎯</div>
            <div className="stat-info">
              <div className="stat-value">{analytics.totalGenerations}</div>
              <div className="stat-label">Total Descriptions</div>
            </div>
          </div>

          {/* Time Saved */}
          <div className="stat-card success">
            <div className="stat-icon">⏱️</div>
            <div className="stat-info">
              <div className="stat-value">{timeSavedHours}h {timeSavedMinutes % 60}m</div>
              <div className="stat-label">Time Saved</div>
            </div>
          </div>

          {/* Platform Uses */}
          <div className="stat-card info">
            <div className="stat-icon">📱</div>
            <div className="stat-info">
              <div className="stat-value">{totalPlatformUses}</div>
              <div className="stat-label">Platform Generations</div>
            </div>
          </div>

          {/* Avg Characters */}
          <div className="stat-card warning">
            <div className="stat-icon">📝</div>
            <div className="stat-info">
              <div className="stat-value">{avgCharactersPerProduct}</div>
              <div className="stat-label">Avg Characters</div>
            </div>
          </div>

        </div>

        {/* Platform Usage Chart */}
        <div className="analytics-row">
          <div className="analytics-card">
            <h3>Platform Usage Breakdown</h3>
            {Object.keys(analytics.platformUsage).length > 0 ? (
              <div className="platform-bars">
                {Object.entries(analytics.platformUsage)
                  .sort((a, b) => b[1] - a[1])
                  .map(([platform, count]) => {
                    const percentage = totalPlatformUses > 0 
                      ? (count / totalPlatformUses) * 100 
                      : 0;
                    return (
                      <div key={platform} className="platform-bar-item">
                        <div className="platform-bar-label">
                          <span>{platformNames[platform]}</span>
                          <span className="platform-bar-count">{count}</span>
                        </div>
                        <div className="platform-bar-bg">
                          <div 
                            className={`platform-bar-fill ${platform}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="platform-bar-percentage">{percentage.toFixed(0)}%</div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="empty-state">
                <p>No data yet. Generate your first product description!</p>
              </div>
            )}
          </div>

          {/* Most Used Platform */}
          <div className="analytics-card highlight">
            <h3>Most Popular Platform</h3>
            {mostUsedPlatform ? (
              <div className="popular-platform">
                <div className="popular-platform-icon">
                  {platformNames[mostUsedPlatform[0]]}
                </div>
                <div className="popular-platform-count">{mostUsedPlatform[1]} times</div>
                <p className="popular-platform-text">
                  Your go-to platform para sa selling!
                </p>
              </div>
            ) : (
              <div className="empty-state">
                <p>Start generating to see your favorite platform!</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Products History */}
        <div className="analytics-card full-width">
          <div className="card-header-row">
            <h3>📜 Generation History</h3>
            {analytics.recentProducts.length > 0 && (
              <button 
                onClick={() => {
                  if (window.confirm('Clear all history?')) {
                    localStorage.removeItem('tindahan_analytics');
                    setAnalytics({
                      totalGenerations: 0,
                      platformUsage: {},
                      recentProducts: []
                    });
                  }
                }}
                className="clear-button"
              >
                Clear History
              </button>
            )}
          </div>

          {analytics.recentProducts.length > 0 ? (
            <div className="history-table">
              <table>
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Platforms</th>
                    <th>Characters</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.recentProducts.map((product, index) => (
                    <tr key={index}>
                      <td className="product-name">{product.name}</td>
                      <td>
                        <div className="platform-tags">
                          {product.platforms.map(p => (
                            <span key={p} className={`platform-tag ${p}`}>
                              {platformNames[p]}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="char-count">{product.characterCount || 'N/A'}</td>
                      <td className="timestamp">
                        {new Date(product.timestamp).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <p>Wala pang history. Generate your first description to start tracking!</p>
            </div>
          )}
        </div>

        {/* Insights */}
        {analytics.totalGenerations > 0 && (
          <div className="insights-section">
            <h3>💡 Insights</h3>
            <div className="insights-grid">
              <div className="insight-card">
                <span className="insight-icon">🚀</span>
                <p>You've saved approximately <strong>{timeSavedHours} hours</strong> of manual writing!</p>
              </div>
              <div className="insight-card">
                <span className="insight-icon">📈</span>
                <p>That's <strong>{analytics.totalGenerations * 3}</strong> unique descriptions created!</p>
              </div>
              <div className="insight-card">
                <span className="insight-icon">💰</span>
                <p>Time saved = more time for selling and growing your business!</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Analytics;