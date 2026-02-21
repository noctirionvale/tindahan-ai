import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    fetchUsage();
  }, []);

  // Sync gender to language to avoid logic errors
  useEffect(() => {
    if (language === 'fil-PH' && !gender.startsWith('FIL-')) {
      setGender('FIL-FEMALE');
    } else if (language === 'en-US' && gender.startsWith('FIL-')) {
      setGender('FEMALE');
    }
  }, [language]);

  const fetchUsage = async () => {
    try {
      const token = localStorage.getItem('tindahan_token');
      const response = await axios.get(
        'https://tindahan-ai-production.up.railway.app/api/usage', // Fixed endpoint to match unified server
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (response.data.success) {
        // Adapt to your unified usage structure
        setUsage(response.data.usage.descriptions); 
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
        'https://tindahan-ai-production.up.railway.app/api/compare', // Using your unified AI route
        { question: `Write a short, persuasive 30-second sales script for a product named ${productName}. Features: ${features}. Language: ${language === 'fil-PH' ? 'Taglish/Filipino' : 'English'}.` },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.success) {
        setScript(response.data.data);
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
        // Refresh usage from the response
        if (response.data.usage) {
          setUsage(response.data.usage);
        }
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

  return (
    <section id="voice-generator" className="voice-generator-section">
      <div className="voice-generator-content">
        
        <div className="voice-generator-header">
          <h2>🎙️ AI Voice Generator</h2>
          <p>Create professional voiceovers for your shop!</p>
          
          {usage && (
            <div className="usage-badge">
              <span>🎤 {usage.remaining} generations left today</span>
            </div>
          )}
        </div>

        <div className="voice-generator-container">
          
          <div className="input-section">
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
                placeholder="e.g., Noise cancellation, 20-hour battery..."
                className="text-area"
                rows="3"
              />
            </div>

            <button 
              onClick={handleGenerateScript}
              disabled={scriptGenerating || !productName}
              className="generate-script-btn"
            >
              {scriptGenerating ? 'Generating...' : '✨ Auto-Generate Script'}
            </button>
          </div>

          <div className="script-section">
            <label>Script</label>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Write your script here..."
              className="script-textarea"
              rows="6"
            />
            <div className="script-info">
              {script.length} / 5000 chars
            </div>
          </div>

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
                {language === 'en-US' ? (
                  <>
                    <option value="FEMALE">Female (Warm)</option>
                    <option value="MALE">Male (Professional)</option>
                    <option value="FEMALE-CASUAL">Female (Casual)</option>
                    <option value="MALE-CASUAL">Male (Casual)</option>
                  </>
                ) : (
                  <>
                    <option value="FIL-FEMALE">Babae (Female)</option>
                    <option value="FIL-MALE">Lalaki (Male)</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {script && !generating && !generatedAudio && (
            <button onClick={handleGenerateVoice} className="generate-voice-btn">
              Generate Voice 🎤
            </button>
          )}

          {generating && (
            <div className="generating-status">
              <div className="loading-spinner"></div>
              <p>Creating your voiceover...</p>
            </div>
          )}

          {generatedAudio && (
            <div className="audio-preview-section">
              <h3>✨ Your Voiceover is Ready!</h3>
              <audio src={generatedAudio} controls autoPlay className="audio-player" />
              <div className="audio-actions">
                <button onClick={downloadAudio} className="download-btn">⬇️ Download</button>
                <button 
                  onClick={() => {
                    setGeneratedAudio(null);
                    setScript('');
                  }} 
                  className="generate-another-btn"
                >
                  New Script
                </button>
              </div>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}
        </div>
      </div>
    </section>
  );
};

export default VoiceGenerator;