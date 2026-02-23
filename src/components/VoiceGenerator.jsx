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
  const [audioBlobUrl, setAudioBlobUrl] = useState(null); // always a blob: URL we own
  const [error, setError] = useState('');
  const [usage, setUsage] = useState(null);
  const [scriptGenerating, setScriptGenerating] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => { fetchUsage(); }, []);

  // Reload + play the audio element whenever we get a new blob URL
  useEffect(() => {
    if (audioBlobUrl && audioRef.current) {
      audioRef.current.load();
      audioRef.current.play().catch(() => {
        // Browser may block autoplay — user can press play manually
      });
    }
  }, [audioBlobUrl]);

  // Clean up blob URL on change or unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      if (audioBlobUrl) URL.revokeObjectURL(audioBlobUrl);
    };
  }, [audioBlobUrl]);

  const fetchUsage = async () => {
    try {
      const token = localStorage.getItem('tindahan_token');
      const response = await axios.get(
        'https://tindahan-ai-production.up.railway.app/api/voice/usage',
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (response.data.success) setUsage(response.data.usage);
    } catch (err) {
      console.error('Failed to fetch voice usage:', err);
    }
  };

  const handleGenerateScript = async () => {
    if (!productName.trim()) { setError('Please enter a product name'); return; }
    setScriptGenerating(true);
    setError('');
    try {
      const token = localStorage.getItem('tindahan_token');
      const response = await axios.post(
        'https://tindahan-ai-production.up.railway.app/api/voice/generate-script',
        { productName, features, language: language.startsWith('fil') ? 'fil' : 'en' },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (response.data.success) setScript(response.data.script);
    } catch (err) {
      setError('Failed to generate script. Please try again.');
    } finally {
      setScriptGenerating(false);
    }
  };

  /**
   * Always converts server response into a local Blob,
   * regardless of whether server returns a URL, base64, or raw binary.
   * A local blob: URL is the only way to guarantee:
   *   - <audio> can play it without CORS issues
   *   - Download saves a file instead of opening a browser tab
   */
  const buildBlobUrl = async (responseData) => {
    let blob = null;

    // Case A: server returned a remote URL → fetch it into a blob
    if (responseData?.audioUrl) {
      const res = await fetch(responseData.audioUrl);
      if (!res.ok) throw new Error('Could not fetch audio from server URL');
      blob = await res.blob();
    }
    // Case B: server returned base64 string → decode into blob
    else if (responseData?.audio) {
      const binary = atob(responseData.audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      blob = new Blob([bytes], { type: 'audio/mpeg' });
    }
    // Case C: raw binary blob (in case server ever changes to binary response)
    else if (responseData instanceof Blob && responseData.size > 0) {
      blob = new Blob([responseData], { type: 'audio/mpeg' });
    }
    else {
      throw new Error(responseData?.message || 'Unexpected response from server');
    }

    // Always return a blob: URL we own — never a remote https: URL
    return URL.createObjectURL(blob);
  };

  const handleGenerateVoice = async () => {
    if (!script.trim()) { setError('Please write or generate a script first'); return; }

    setGenerating(true);
    setError('');

    // Revoke previous blob URL before replacing it
    if (audioBlobUrl) {
      URL.revokeObjectURL(audioBlobUrl);
      setAudioBlobUrl(null);
    }

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
          // No responseType: 'blob' — let axios parse JSON response normally
        }
      );

      const blobUrl = await buildBlobUrl(response.data);
      setAudioBlobUrl(blobUrl);

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

  /**
   * Download the audio as a file.
   *
   * Because audioBlobUrl is always a blob: URL (never https:), the browser
   * will ALWAYS treat this as a file download — it will never open a new tab
   * or redirect. This is the key difference from using a remote URL.
   */
  const handleDownload = () => {
    if (!audioBlobUrl) return;

    const link = document.createElement('a');
    link.href = audioBlobUrl;
    link.download = `tindahan-voice-${Date.now()}.mp3`;

    // Must be in the DOM for Firefox compatibility
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    // Small delay before removing so the click registers
    setTimeout(() => document.body.removeChild(link), 100);
  };

  const handleReset = () => {
    if (audioBlobUrl) URL.revokeObjectURL(audioBlobUrl);
    setAudioBlobUrl(null);
    setScript('');
    setProductName('');
    setFeatures('');
    setError('');
  };

  return (
    <div className="voice-wrapper">
      <div className="voice-split">

        {/* ── LEFT: Form Panel ── */}
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

          {script && !generating && !audioBlobUrl && (
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

        {/* ── RIGHT: Results Panel ── */}
        <div className="voice-results-panel">
          {!generating && !audioBlobUrl && (
            <div className="voice-empty">
              <div className="voice-empty-icon">🎤</div>
              <p>Your voiceover will appear here</p>
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
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default VoiceGenerator;