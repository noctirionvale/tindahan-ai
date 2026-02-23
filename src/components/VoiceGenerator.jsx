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

  // Clean up audio URL when component unmounts or new audio is generated
  useEffect(() => {
    return () => {
      if (generatedAudio && generatedAudio.startsWith('blob:')) {
        URL.revokeObjectURL(generatedAudio);
      }
    };
  }, [generatedAudio]);

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
      
      // Make sure we're sending the right request
      const response = await axios.post(
        'https://tindahan-ai-production.up.railway.app/api/voice/generate',
        { 
          text: script, 
          language, 
          gender 
        },
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000,
          responseType: 'blob' // Important: Get blob response
        }
      );

      // Check if response is actually an audio blob
      if (response.data instanceof Blob) {
        // Create blob URL
        const url = URL.createObjectURL(response.data);
        setGeneratedAudio(url);
        
        // Update usage if needed
        if (usage) {
          setUsage({
            ...usage,
            remaining: usage.remaining - 1,
            today: (usage.today || 0) + 1,
            total: (usage.total || 0) + 1
          });
        }
      } else {
        throw new Error('Invalid response format');
      }

    } catch (err) {
      console.error('Generation error:', err);
      
      // Try to get error message if it's JSON
      if (err.response?.data instanceof Blob) {
        const text = await err.response.data.text();
        try {
          const errorData = JSON.parse(text);
          setError(errorData.message || 'Failed to generate voice');
        } catch {
          setError('Failed to generate voice. Please try again.');
        }
      } else if (err.response?.status === 429) {
        setError('Limit reached! Upgrade your plan.');
      } else {
        setError('Failed to generate voice. Please try again.');
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedAudio) return;
    
    const link = document.createElement('a');
    link.href = generatedAudio;
    link.download = `tindahan-voice-${Date.now()}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    // Clean up blob URL
    if (generatedAudio && generatedAudio.startsWith('blob:')) {
      URL.revokeObjectURL(generatedAudio);
    }
    setGeneratedAudio(null);
    setScript('');
    setProductName('');
    setFeatures('');
    setError('');
  };

  return (
    <div className="voice-wrapper">
      <div className="voice-split">
        {/* LEFT: Form Panel */}
        <div className="voice-form-panel">
          <h2 className="voice-title">🎙️ Generate Voice</h2>
          
          {usage && (
            <div className="voice-usage">
              🎤 {usage.remaining}/{usage.limit} left today
            </div>
          )}

          {/* Product Details Section */}
          <div className="voice-section">
            <div className="voice-section-header">
              <h3>PRODUCT DETAILS</h3>
              <span>Required for script generation</span>
            </div>

            <div className="voice-input-group">
              <label>Product Name *</label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g., Wireless Bluetooth Earbuds"
                className="voice-input"
              />
            </div>

            <div className="voice-input-group">
              <label>Features (Optional)</label>
              <textarea
                value={features}
                onChange={(e) => setFeatures(e.target.value)}
                placeholder="e.g., Noise cancellation, 20-hour battery, waterproof..."
                className="voice-textarea"
                rows="3"
              />
            </div>

            <button 
              onClick={handleGenerateScript}
              disabled={scriptGenerating || !productName}
              className="voice-script-btn"
            >
              {scriptGenerating ? 'Generating Script...' : '✨ Auto-Generate Script'}
            </button>
          </div>

          {/* Script Section */}
          <div className="voice-section">
            <div className="voice-section-header">
              <h3>VOICE SCRIPT</h3>
              <span>{script.length} / 5000 characters</span>
            </div>
            
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Write your voiceover script here or generate one automatically..."
              className="voice-script-textarea"
              rows="6"
            />
          </div>

          {/* Voice Options */}
          <div className="voice-options-grid">
            <div className="voice-option">
              <label>Language</label>
              <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value)}
                className="voice-select"
              >
                <option value="en-US">🇺🇸 English (US)</option>
                <option value="fil-PH">🇵🇭 Tagalog (Filipino)</option>
              </select>
            </div>

            <div className="voice-option">
              <label>Voice Style</label>
              <select 
                value={gender} 
                onChange={(e) => setGender(e.target.value)}
                className="voice-select"
              >
                <optgroup label="🇺🇸 English Voices">
                  <option value="FEMALE">Female (Warm)</option>
                  <option value="MALE">Male (Professional)</option>
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
            <button onClick={handleGenerateVoice} className="voice-generate-btn">
              Generate Voice 🎤
            </button>
          )}

          {/* Generating State */}
          {generating && (
            <div className="voice-generating">
              <div className="voice-spinner"></div>
              <p>Creating your voiceover...</p>
              <p className="voice-hint">This may take up to 30 seconds</p>
            </div>
          )}

          {/* Error Message */}
          {error && !generating && (
            <div className="voice-error">
              {error}
              {error.includes('limit') && (
                <a href="#pricing" className="voice-upgrade-link">Upgrade Now →</a>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: Results Panel */}
        <div className="voice-results-panel">
          {!generating && !generatedAudio && (
            <div className="voice-empty">
              <div className="voice-empty-icon">🎤</div>
              <p>Your voiceover will appear here</p>
            </div>
          )}

          {generatedAudio && !generating && (
            <>
              <div className="voice-results-header">
                <h3>Your Voiceover</h3>
              </div>
              <div className="voice-result-container">
                <div className="voice-player-wrapper">
                  <audio 
                    controls
                    className="voice-player"
                  >
                    <source src={generatedAudio} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </div>

                <div className="voice-action-buttons">
                  <button 
                    onClick={handleDownload} 
                    className="voice-download-btn"
                  >
                    ⬇️ Download MP3
                  </button>
                  <button 
                    onClick={handleReset}
                    className="voice-new-btn"
                  >
                    New Voiceover
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceGenerator;