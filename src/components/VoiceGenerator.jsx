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
  const [debugInfo, setDebugInfo] = useState('');
  const audioRef = useRef(null);

  useEffect(() => {
    fetchUsage();
  }, []);

  useEffect(() => {
    if (generatedAudio && audioRef.current) {
      audioRef.current.load();
      audioRef.current.play().catch(() => {});
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

  /**
   * Reads magic bytes from blob to detect true audio format.
   * Logs hex bytes to console for debugging.
   */
  const detectAudioType = async (blob) => {
    const buffer = await blob.slice(0, 16).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(' ');

    console.log('🔍 Audio blob — size:', blob.size, 'bytes | MIME from server:', blob.type);
    console.log('🔍 First 16 bytes (hex):', hex);
    setDebugInfo(`Size: ${blob.size}B | Server MIME: "${blob.type}" | Bytes: ${hex}`);

    // Trust server MIME if it's valid
    if (blob.type === 'audio/mpeg')  return { mimeType: 'audio/mpeg', ext: 'mp3' };
    if (blob.type === 'audio/mp3')   return { mimeType: 'audio/mpeg', ext: 'mp3' };
    if (blob.type === 'audio/ogg')   return { mimeType: 'audio/ogg',  ext: 'ogg' };
    if (blob.type === 'audio/wav')   return { mimeType: 'audio/wav',  ext: 'wav' };
    if (blob.type === 'audio/mp4')   return { mimeType: 'audio/mp4',  ext: 'm4a' };
    if (blob.type === 'audio/aac')   return { mimeType: 'audio/aac',  ext: 'aac' };
    if (blob.type === 'audio/webm')  return { mimeType: 'audio/webm', ext: 'webm' };

    // Detect from magic bytes
    // OGG: "OggS"
    if (bytes[0] === 0x4F && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53) {
      console.log('✅ Detected: OGG'); return { mimeType: 'audio/ogg', ext: 'ogg' };
    }
    // MP3: ID3 tag
    if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
      console.log('✅ Detected: MP3 (ID3)'); return { mimeType: 'audio/mpeg', ext: 'mp3' };
    }
    // MP3: raw sync bytes
    if (bytes[0] === 0xFF && (bytes[1] & 0xE0) === 0xE0) {
      console.log('✅ Detected: MP3 (sync)'); return { mimeType: 'audio/mpeg', ext: 'mp3' };
    }
    // WAV: "RIFF"
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
      console.log('✅ Detected: WAV'); return { mimeType: 'audio/wav', ext: 'wav' };
    }
    // M4A/MP4: "ftyp" at offset 4
    if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
      console.log('✅ Detected: M4A/MP4'); return { mimeType: 'audio/mp4', ext: 'm4a' };
    }
    // WEBM: 0x1A 0x45 0xDF 0xA3
    if (bytes[0] === 0x1A && bytes[1] === 0x45 && bytes[2] === 0xDF && bytes[3] === 0xA3) {
      console.log('✅ Detected: WebM'); return { mimeType: 'audio/webm', ext: 'webm' };
    }
    // AAC: ADTS sync
    if (bytes[0] === 0xFF && (bytes[1] === 0xF1 || bytes[1] === 0xF9)) {
      console.log('✅ Detected: AAC'); return { mimeType: 'audio/aac', ext: 'aac' };
    }

    console.warn('⚠️ Unknown format — defaulting to OGG');
    return { mimeType: 'audio/ogg', ext: 'ogg' };
  };

  const handleGenerateVoice = async () => {
    if (!script.trim()) {
      setError('Please write or generate a script first');
      return;
    }

    setGenerating(true);
    setError('');
    setDebugInfo('');

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

      if (!(response.data instanceof Blob) || response.data.size === 0) {
        throw new Error('Empty or invalid audio response from server');
      }

      const { mimeType, ext } = await detectAudioType(response.data);
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
        setError(err.message || 'Failed to generate voice. Please try again.');
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedAudio) return;
    const link = document.createElement('a');
    link.href = generatedAudio.url;
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
    setDebugInfo('');
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

          {/* Debug panel — remove after confirming format */}
          {debugInfo && (
            <div style={{
              marginTop: '10px', padding: '8px',
              background: '#111', borderRadius: '6px',
              fontSize: '11px', color: '#aaa',
              fontFamily: 'monospace', wordBreak: 'break-all',
              border: '1px solid #333'
            }}>
              🔍 DEBUG: {debugInfo}
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
                <span style={{ fontSize: '12px', color: '#888' }}>
                  {generatedAudio.mimeType} · .{generatedAudio.ext}
                </span>
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
                    ⬇️ Download {generatedAudio.ext.toUpperCase()}
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