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
  const [audioBlobUrl, setAudioBlobUrl] = useState(null);
  const [error, setError] = useState('');
  const [usage, setUsage] = useState(null);
  const [scriptGenerating, setScriptGenerating] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    fetchUsage();
  }, []);

  useEffect(() => {
    return () => {
      if (audioBlobUrl && audioBlobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioBlobUrl);
      }
    };
  }, [audioBlobUrl]);

  useEffect(() => {
    if (audioBlobUrl && audioRef.current) {
      audioRef.current.load();
      audioRef.current.play().catch(err => {
        console.log('Autoplay prevented:', err);
      });
    }
  }, [audioBlobUrl]);

  // Reset gender when language changes to avoid invalid voice selection
  useEffect(() => {
    if (language === 'en-US') setGender('FEMALE');
    if (language === 'fil-PH') setGender('FIL-FEMALE');
  }, [language]);

  const fetchUsage = async () => {
    try {
      const token = localStorage.getItem('tindahan_token');
      const response = await axios.get(
        '/api/voice/usage',
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
        '/api/voice/generate-script',
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

    if (audioBlobUrl && audioBlobUrl.startsWith('blob:')) {
      URL.revokeObjectURL(audioBlobUrl);
    }
    setAudioBlobUrl(null);
    setGeneratedAudio(null);

    try {
      const token = localStorage.getItem('tindahan_token');

      const response = await axios.post(
        '/api/voice/generate',
        { text: script, language, gender },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      if (response.data.success && response.data.audioUrl) {
        setGeneratedAudio(response.data.audioUrl);

        const base64Data = response.data.audioUrl.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'audio/mpeg' });
        const blobUrl = URL.createObjectURL(blob);
        setAudioBlobUrl(blobUrl);

        if (response.data.usage) {
          setUsage({
            ...usage,
            remaining: response.data.usage.remaining,
            today: (usage?.today || 0) + 1,
            total: (usage?.total || 0) + 1
          });
        }
      }
    } catch (err) {
      console.error('Generation error:', err);
      if (err.response?.status === 429) {
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
    if (audioBlobUrl && audioBlobUrl.startsWith('blob:')) {
      URL.revokeObjectURL(audioBlobUrl);
    }
    setAudioBlobUrl(null);
    setGeneratedAudio(null);
    setScript('');
    setProductName('');
    setFeatures('');
    setError('');
  };

  // Voice options
  const voiceOptions = {
  'FEMALE': { name: 'en-US-Neural2-F', languageCode: 'en-US' },
  'MALE': { name: 'en-US-Neural2-D', languageCode: 'en-US' },
  'FEMALE-CASUAL': { name: 'en-US-Neural2-C', languageCode: 'en-US' },
  'MALE-CASUAL': { name: 'en-US-Neural2-A', languageCode: 'en-US' },
  'FEMALE-CALM': { name: 'en-US-Neural2-G', languageCode: 'en-US' },
  'FEMALE-CHEERFUL': { name: 'en-US-Neural2-H', languageCode: 'en-US' },
  'MALE-DEEP': { name: 'en-US-Neural2-I', languageCode: 'en-US' },
  'MALE-NARRATION': { name: 'en-US-Neural2-J', languageCode: 'en-US' },
  'FEMALE-STUDIO': { name: 'en-US-Studio-O', languageCode: 'en-US' },
  'MALE-STUDIO': { name: 'en-US-Studio-Q', languageCode: 'en-US' },
  'FIL-FEMALE': { name: 'fil-PH-Wavenet-A', languageCode: 'fil-PH' },
  'FIL-MALE': { name: 'fil-PH-Wavenet-C', languageCode: 'fil-PH' }
};

  const currentVoices = voiceOptions[language] || voiceOptions['en-US'];
  const availableVoices = currentVoices.filter(v => v.available);

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
                {availableVoices.map(voice => (
                  <option key={voice.value} value={voice.value}>
                    {voice.label}
                  </option>
                ))}
              </select>

              {/* Coming Soon voices preview */}
              <div className="voice-coming-soon-list">
                {currentVoices.filter(v => !v.available).map(voice => (
                  <div key={voice.value} className="voice-coming-soon-item">
                    <span className="voice-coming-soon-label">{voice.label}</span>
                    <span className="coming-soon-badge">🔜 Coming Soon</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Generate Button */}
          {script && !generating && !audioBlobUrl && (
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

          {/* Error */}
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
          {!generating && !audioBlobUrl && (
            <div className="voice-empty">
              <div className="voice-empty-icon">🎤</div>
              <p>Your voiceover will appear here</p>

              {/* Coming Soon — Video Combo teaser */}
              <div className="voice-combo-teaser">
                <div className="combo-teaser-icon">🎬</div>
                <p><strong>Combo Generator</strong></p>
                <p className="combo-teaser-sub">
                  Generate description + voice + video in one click
                </p>
                <span className="coming-soon-badge large">🔜 Coming Soon</span>
              </div>
            </div>
          )}

          {audioBlobUrl && !generating && (
            <>
              <div className="voice-results-header">
                <h3>Your Voiceover</h3>
              </div>
              <div className="voice-result-container">
                <div className="voice-player-wrapper">
                  <audio
                    ref={audioRef}
                    controls
                    src={audioBlobUrl}
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

                {/* Combo teaser after generation */}
                <div className="voice-combo-teaser post-gen">
                  <p>🎬 Want this as a full video ad?</p>
                  <span className="coming-soon-badge">Combo Generator — Coming Soon</span>
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