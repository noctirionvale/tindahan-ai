import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './VoiceGenerator.css';

const VoiceGenerator = () => {
  const [productName, setProductName] = useState('');
  const [features, setFeatures] = useState('');
  const [script, setScript] = useState('');
  const [language, setLanguage] = useState('en-US');
  const [gender, setGender] = useState('FEMALE');
  const [generating, setGenerating] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState(null);
  const [error, setError] = useState('');
  const [usage, setUsage] = useState(null);
  const [scriptGenerating, setScriptGenerating] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [prompt, setPrompt] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const token = localStorage.getItem('tindahan_token');
      const response = await axios.get(
        'https://tindahan-ai-production.up.railway.app/api/voice/usage',
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (response.data.success) {
        setUsage(response.data.usage);
      }
    } catch (err) {
      console.error('Failed to fetch voice usage:', err);
    }
  };

  const handleGenerateScript = async () => {
    if (!productName.trim()) {
      setError('Please enter a product name');
      return;
    }

    setScriptGenerating(true);
    setError('');

    try {
      const token = localStorage.getItem('tindahan_token');
      const response = await axios.post(
        'https://tindahan-ai-production.up.railway.app/api/voice/generate-script',
        {
          productName,
          features,
          language: language.startsWith('fil') ? 'fil' : 'en'
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.success) {
        setScript(response.data.script);
      }
    } catch (err) {
      setError('Failed to generate script. Please try again.');
    } finally {
      setScriptGenerating(false);
    }
  };

  const handleGenerateVoice = async () => {
    if (!script.trim()) {
      setError('Please write or generate a script first');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      const token = localStorage.getItem('tindahan_token');
      const response = await axios.post(
        'https://tindahan-ai-production.up.railway.app/api/voice/generate',
        { text: script, language, gender },
        { 
          headers: { 'Authorization': `Bearer ${token}` },
          timeout: 30000
        }
      );

      if (response.data.success) {
        setGeneratedAudio(response.data.audioUrl);
        setUsage({
          ...usage,
          remaining: response.data.usage.remaining,
          today: (usage?.today || 0) + 1,
          total: (usage?.total || 0) + 1
        });
      }
    } catch (err) {
      if (err.response?.status === 429) {
        setError(err.response.data.message || 'Limit reached! Upgrade your plan.');
      } else {
        setError('Failed to generate voice. Please try again.');
      }
    } finally {
      setGenerating(false);
    }
  };

  const downloadAudio = () => {
    if (!generatedAudio) return;
    const link = document.createElement('a');
    link.href = generatedAudio;
    link.download = `tindahan-voice-${Date.now()}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filters = ['All', 'Voices', 'Styles', 'Languages'];

  return (
    <section id="voice-generator" className="voice-generator-section">
      <div className="voice-generator-content">
        
        <div className="voice-generator-header">
          <h2>🎙️ AI Voice Generator</h2>
          <p>Create professional voiceovers in English & Tagalog!</p>
          
          {usage && (
            <div className="usage-badge">
              {usage.plan === 'free' ? (
                <span>🎤 {usage.remaining} free voice remaining</span>
              ) : (
                <span>🎤 {usage.remaining}/{usage.limit} voices left today</span>
              )}
            </div>
          )}
        </div>

        <div className="voice-generator-container">
          
          {/* Ideas Bar - Like Luma Labs */}
          <div className="ideas-bar">
            <span className="ideas-label">VOICE IDEAS</span>
            <div className="ideas-filters">
              {filters.map((filter) => (
                <button
                  key={filter}
                  className={`idea-filter ${activeFilter === filter ? 'active' : ''}`}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Keyframe Reference - Like Luma Labs */}
          <div className="keyframe-reference">
            <div className="keyframe-info">
              <span className="keyframe-badge">VOICE SAMPLE</span>
              <span className="keyframe-text">REFERENCE · PROFESSIONAL · 2 DAYS AGO</span>
            </div>
            <div className="keyframe-actions">
              <button className="keyframe-btn">REFERENCE</button>
              <button className="keyframe-btn modify">MODIFY</button>
            </div>
          </div>

          {/* Prompt Input - Like Luma Labs */}
          <input
            type="text"
            className="prompt-input"
            placeholder="Describe the voice style you want... (e.g., energetic, professional, warm)"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />

          {/* Product Info - Enhanced */}
          <div className="input-section">
            <div className="upload-header" style={{ marginBottom: '16px' }}>
              <h3>PRODUCT DETAILS</h3>
              <span>Required for script generation</span>
            </div>

            <div className="input-group">
              <label>Product Name *</label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g., Wireless Bluetooth Earbuds"
                className="text-input"
              />
            </div>

            <div className="input-group">
              <label>Features (Optional)</label>
              <textarea
                value={features}
                onChange={(e) => setFeatures(e.target.value)}
                placeholder="e.g., Noise cancellation, 20-hour battery, waterproof..."
                className="text-area"
                rows="3"
              />
            </div>

            <button 
              onClick={handleGenerateScript}
              disabled={scriptGenerating || !productName}
              className="generate-script-btn"
            >
              {scriptGenerating ? 'Generating Script...' : '✨ Auto-Generate Script'}
            </button>
          </div>

          {/* Script Editor - Enhanced */}
          <div className="script-section">
            <div className="upload-header" style={{ marginBottom: '16px' }}>
              <h3>VOICE SCRIPT</h3>
              <span>{script.length} / 5000 characters</span>
            </div>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Write your voiceover script here or generate one automatically..."
              className="script-textarea"
              rows="6"
            />
          </div>

          {/* Voice Options - Enhanced */}
          <div className="voice-options">
            <div className="option-group">
              <label>Language</label>
              <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value)}
                className="select-input"
              >
                <option value="en-US">🇺🇸 English (US)</option>
                <option value="fil-PH">🇵🇭 Tagalog (Filipino)</option>
              </select>
            </div>

            <div className="option-group">
              <label>Voice Style</label>
              <select 
                value={gender} 
                onChange={(e) => setGender(e.target.value)}
                className="select-input"
              >
                <optgroup label="🇺🇸 English Voices">
                  <option value="FEMALE">Female (Warm)</option>
                  <option value="MALE">Male (Professional)</option>
                  <option value="FEMALE-CASUAL">Female (Casual)</option>
                  <option value="MALE-CASUAL">Male (Casual)</option>
                </optgroup>
                <optgroup label="🇵🇭 Tagalog Voices">
                  <option value="FIL-FEMALE">Babae (Female)</option>
                  <option value="FIL-MALE">Lalaki (Male)</option>
                </optgroup>
              </select>
            </div>
          </div>

          {/* Generate Button */}
          {script && !generating && !generatedAudio && (
            <button 
              onClick={handleGenerateVoice} 
              className="generate-voice-btn"
            >
              Generate Voice 🎤
            </button>
          )}

          {/* Generating Status */}
          {generating && (
            <div className="generating-status">
              <div className="loading-spinner"></div>
              <p>Creating your voiceover...</p>
              <p className="generating-hint">This may take up to 30 seconds</p>
            </div>
          )}

          {/* Audio Preview */}
          {generatedAudio && (
            <div className="audio-preview-section">
              <h3>✨ Your Voiceover is Ready!</h3>
              <div className="audio-player-wrapper">
                <audio src={generatedAudio} controls className="audio-player" />
              </div>
              <div className="audio-actions">
                <button onClick={downloadAudio} className="download-btn">
                  ⬇️ Download Audio
                </button>
                <button 
                  onClick={() => {
                    setGeneratedAudio(null);
                    setScript('');
                    setProductName('');
                    setFeatures('');
                  }}
                  className="generate-another-btn"
                >
                  Generate Another
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {error && !generating && (
            <div className="error-message">
              {error}
              {error.includes('limit') && (
                <a href="#pricing" className="upgrade-link"> Upgrade Now →</a>
              )}
            </div>
          )}

        </div>

        {/* Use Cases */}
        <div className="use-cases">
          <h3>Perfect For:</h3>
          <div className="cases-grid">
            <div className="case">
              <span className="case-icon">🎬</span>
              <h4>Video Ads</h4>
              <p>Add voiceover to product videos</p>
            </div>
            <div className="case">
              <span className="case-icon">📱</span>
              <h4>TikTok & Reels</h4>
              <p>Engaging social media content</p>
            </div>
            <div className="case">
              <span className="case-icon">🛍️</span>
              <h4>Shopee Live</h4>
              <p>Pre-recorded product intros</p>
            </div>
            <div className="case">
              <span className="case-icon">📻</span>
              <h4>Audio Ads</h4>
              <p>Radio-style promotions</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default VoiceGenerator;