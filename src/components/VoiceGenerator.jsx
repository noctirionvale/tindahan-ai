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
    if (generatedAudio && audioRef.current) {
      // Force reload the audio element
      audioRef.current.load();
      audioRef.current.play().catch(err => {
        console.log('Autoplay prevented:', err);
      });
    }
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
      
      // Backend returns JSON with base64 audioUrl
      const response = await axios.post(
        'https://tindahan-ai-production.up.railway.app/api/voice/generate',
        { text: script, language, gender },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
          // Don't use responseType: 'blob' - backend sends JSON with base64
        }
      );

      if (response.data.success && response.data.audioUrl) {
        // audioUrl is already a data URI: "data:audio/mpeg;base64,..."
        // Use it directly - HTML5 audio supports data URIs
        setGeneratedAudio(response.data.audioUrl);

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
    
    // For data URI, we need to convert to blob for download
    const link = document.createElement('a');
    link.href = generatedAudio;
    link.download = `tindahan-voice-${Date.now()}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    // Clean up if using blob URL
    if (generatedAudio?.startsWith('blob:')) {
      URL.revokeObjectURL(generatedAudio);
    }
    setGeneratedAudio(null);
    setScript('');
    setProductName('');
    setFeatures('');
    setError('');
  };

  return (
    <div className="gen-wrapper">
      <div className="gen-split">
        {/* LEFT: Form Panel */}
        <div className="gen-form-panel">
          <h2 className="gen-title">🎙️ Generate Voice</h2>
          <p className="gen-subtitle">Create professional voiceovers</p>

          {usage && (
            <div className="gen-usage">
              🎤 {usage.remaining}/{usage.limit} left today
            </div>
          )}

          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Product name..."
            className="gen-input"
          />

          <textarea
            value={features}
            onChange={(e) => setFeatures(e.target.value)}
            placeholder="Features (optional)..."
            className="gen-textarea"
            rows="2"
          />

          <button
            onClick={handleGenerateScript}
            disabled={scriptGenerating || !productName}
            className="gen-btn"
          >
            {scriptGenerating ? 'Generating...' : '✨ Auto-Generate Script'}
          </button>

          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder="Your script or generate one..."
            className="gen-textarea"
            rows="4"
          />
          <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
            {script.length} / 5000
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.9)' }}>Language</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="gen-input" style={{ cursor: 'pointer' }}>
                <option value="en-US">🇺🇸 English</option>
                <option value="fil-PH">🇵🇭 Tagalog</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.9)' }}>Voice</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)} className="gen-input" style={{ cursor: 'pointer' }}>
                <optgroup label="English">
                  <option value="FEMALE">Female</option>
                  <option value="MALE">Male</option>
                </optgroup>
                <optgroup label="Tagalog">
                  <option value="FIL-FEMALE">Babae</option>
                  <option value="FIL-MALE">Lalaki</option>
                </optgroup>
              </select>
            </div>
          </div>

          {script && !generating && !generatedAudio && (
            <button onClick={handleGenerateVoice} className="gen-btn" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
              Generate Voice 🎤
            </button>
          )}

          {generating && (
            <div className="gen-loading">
              <div className="loading-spinner"></div>
              <p>Creating voiceover...</p>
            </div>
          )}

          {error && !generating && (
            <div className="gen-error">
              {error}
              {error.includes('limit') && <a href="#pricing" style={{ marginLeft: '0.5rem', color: '#10b981' }}>Upgrade →</a>}
            </div>
          )}
        </div>

        {/* RIGHT: Results Panel */}
        <div className="gen-results-panel">
          {!generating && !generatedAudio && (
            <div className="gen-empty">
              <div className="gen-empty-icon">🎤</div>
              <p>Your voiceover will appear here</p>
            </div>
          )}

          {generatedAudio && !generating && (
            <>
              <div className="gen-results-header">
                <h3>Your Voiceover</h3>
              </div>
              <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                <audio
                  ref={audioRef}
                  controls
                  src={generatedAudio}
                  style={{ width: '100%', maxWidth: '500px', borderRadius: '12px' }}
                />

                <div style={{ display: 'flex', gap: '1rem', width: '100%', maxWidth: '500px' }}>
                  <button onClick={handleDownload} className="gen-btn" style={{ flex: 1 }}>
                    ⬇️ Download
                  </button>
                  <button onClick={handleReset} className="gen-reset" style={{ flex: 1 }}>
                    New Voice
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