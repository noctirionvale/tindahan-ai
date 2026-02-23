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
  const [generatedAudio, setGeneratedAudio] = useState(null); // { url, mimeType, ext }
  const [error, setError] = useState('');
  const [usage, setUsage] = useState(null);
  const [scriptGenerating, setScriptGenerating] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    fetchUsage();
  }, []);

  // When generatedAudio changes, force the audio element to reload and play
  useEffect(() => {
    if (generatedAudio && audioRef.current) {
      audioRef.current.load();
      audioRef.current.play().catch(() => {
        // Autoplay blocked by browser — that's fine, user can press play
      });
    }
  }, [generatedAudio]);

  // Clean up blob URL on unmount or replacement
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

  // Detect real MIME type from the blob's first bytes
  const detectAudioType = async (blob) => {
    const buffer = await blob.slice(0, 12).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // OGG: starts with OggS
    if (bytes[0] === 0x4F && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53) {
      return { mimeType: 'audio/ogg', ext: 'ogg' };
    }
    // MP3: ID3 tag or sync bytes
    if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
      return { mimeType: 'audio/mpeg', ext: 'mp3' };
    }
    if (bytes[0] === 0xFF && (bytes[1] === 0xFB || bytes[1] === 0xF3 || bytes[1] === 0xF2)) {
      return { mimeType: 'audio/mpeg', ext: 'mp3' };
    }
    // WAV: RIFF....WAVE
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
      return { mimeType: 'audio/wav', ext: 'wav' };
    }
    // AAC / M4A: ftyp box or ADTS sync
    if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
      return { mimeType: 'audio/mp4', ext: 'm4a' };
    }
    if (bytes[0] === 0xFF && (bytes[1] & 0xF0) === 0xF0) {
      return { mimeType: 'audio/aac', ext: 'aac' };
    }

    // Fallback — try ogg since Google TTS often returns ogg
    return { mimeType: 'audio/ogg', ext: 'ogg' };
  };

  const handleGenerateVoice = async () => {
    if (!script.trim()) {
      setError('Please write or generate a script first');
      return;
    }

    setGenerating(true);
    setError('');

    // Revoke old blob URL
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
          timeout: 30000,
          responseType: 'blob'
        }
      );

      if (!(response.data instanceof Blob)) {
        throw new Error('Invalid response format');
      }

      // Detect real audio type from magic bytes
      const { mimeType, ext } = await detectAudioType(response.data);

      // Re-wrap blob with correct MIME type so the browser plays it correctly
      const correctedBlob = new Blob([response.data], { type: mimeType });
      const url = URL.createObjectURL(correctedBlob);

      setGeneratedAudio({ url, mimeType, ext });

      if (usage) {
        setUsage({
          ...usage,
          remaining: usage.remaining - 1,
          today: (usage.today || 0) + 1,
          total: (usage.total || 0) + 1
        });
      }

    } catch (err) {
      console.error('Generation error:', err);

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
    link.href = generatedAudio.url;
    // Use the correct extension so the OS opens it properly
    link.download = `tindahan-voice-${Date.now()}.${generatedAudio.ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                  {/*
                    KEY FIX: Use ref + src directly on <audio> (not <source>).
                    The ref lets us call .load()/.play() imperatively when the URL changes.
                    Setting src directly (not via <source>) is more reliable across browsers.
                  */}
                  <audio
                    ref={audioRef}
                    controls
                    src={generatedAudio.url}
                    className="voice-player"
                  />
                </div>

                <div className="voice-action-buttons">
                  <button onClick={handleDownload} className="voice-download-btn">
                    ⬇️ Download Audio
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