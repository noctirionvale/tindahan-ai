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
  const audioRef = useRef(null);

  useEffect(() => {
    fetchUsage();
  }, []);

  useEffect(() => {
    if (generatedAudio?.url && audioRef.current) {
      audioRef.current.load();
    }
  }, [generatedAudio]);

  useEffect(() => {
    return () => {
      if (generatedAudio?.url?.startsWith('blob:')) {
        URL.revokeObjectURL(generatedAudio.url);
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

    if (generatedAudio?.url?.startsWith('blob:')) {
      URL.revokeObjectURL(generatedAudio.url);
    }
    setGeneratedAudio(null);

    try {
      const token = localStorage.getItem('tindahan_token');
      
      const response = await axios.post(
        'https://tindahan-ai-production.up.railway.app/api/voice/generate',
        { text: script, language, gender },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      console.log('Server response:', response.data);

      // Check if the server returns a URL
      if (response.data.success && response.data.audioUrl) {
        // Store the URL but don't create blob yet
        setGeneratedAudio({
          url: response.data.audioUrl,  // Keep original URL
          mimeType: 'audio/mpeg',
          ext: 'mp3'
        });

        if (usage) {
          setUsage({
            ...usage,
            remaining: usage.remaining - 1,
            today: (usage.today || 0) + 1,
            total: (usage.total || 0) + 1
          });
        }
      } 
      // If it returns base64 audio data
      else if (response.data.success && response.data.audio) {
        // Convert base64 to blob
        const byteCharacters = atob(response.data.audio);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        
        setGeneratedAudio({
          url: url,
          mimeType: 'audio/mpeg',
          ext: 'mp3'
        });

        if (usage) {
          setUsage({
            ...usage,
            remaining: usage.remaining - 1,
            today: (usage.today || 0) + 1,
            total: (usage.total || 0) + 1
          });
        }
      }
      else {
        throw new Error(response.data.message || 'Invalid response from server');
      }

    } catch (err) {
      console.error('Generation error:', err);

      if (err.response?.status === 429) {
        setError('Limit reached! Upgrade your plan.');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError(err.message || 'Failed to generate voice. Please try again.');
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedAudio) return;
    
    try {
      // Show downloading feedback
      setError('Preparing download...');
      
      // Fetch the audio file from the URL
      const response = await fetch(generatedAudio.url);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tindahan-voice-${Date.now()}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      setError(''); // Clear downloading message
      
    } catch (err) {
      console.error('Download failed:', err);
      setError('Download failed. Try right-click and "Save Audio As..."');
      
      // Fallback: open in new tab
      window.open(generatedAudio.url, '_blank');
    }
  };

  const handleReset = () => {
    if (generatedAudio?.url?.startsWith('blob:')) {
      URL.revokeObjectURL(generatedAudio.url);
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

          <div className="voice-options-grid">
            <div className="voice-option">
              <label>Language</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="voice-select">
                <option value="en-US">🇺🇸 English (US)</option>
                <option value="fil-PH">🇵🇭 Tagalog (Filipino)</option>
              </select>
            </div>
            <div className="voice-option">
              <label>Voice Style</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)} className="voice-select">
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

          {script && !generating && !generatedAudio && (
            <button onClick={handleGenerateVoice} className="voice-generate-btn">
              Generate Voice 🎤
            </button>
          )}

          {generating && (
            <div className="voice-generating">
              <div className="voice-spinner"></div>
              <p>Creating your voiceover...</p>
              <p className="voice-hint">This may take up to 30 seconds</p>
            </div>
          )}

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
                    ref={audioRef}
                    controls
                    src={generatedAudio.url}
                    className="voice-player"
                  />
                </div>

                <div className="voice-action-buttons">
                  <button onClick={handleDownload} className="voice-download-btn">
                    ⬇️ Download MP3
                  </button>
                  <button onClick={handleReset} className="voice-new-btn">
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