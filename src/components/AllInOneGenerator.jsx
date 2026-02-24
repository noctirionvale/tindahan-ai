import React, { useState, useRef } from 'react';
import axios from 'axios';
import './AllInOneGenerator.css';

const AllInOneGenerator = () => {
  const [productName, setProductName] = useState('');
  const [features, setFeatures] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, status: '' });
  const [results, setResults] = useState({
    descriptions: null,
    video: null,
    voice: null
  });
  const [selectedOptions, setSelectedOptions] = useState({
    descriptions: true,
    video: true,
    voice: true
  });
  const [selectedPlatforms, setSelectedPlatforms] = useState(['shopee', 'lazada', 'tiktok']);
  const [voiceLanguage, setVoiceLanguage] = useState('en-US');
  const [voiceGender, setVoiceGender] = useState('FEMALE');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const platformInfo = {
    shopee: { name: 'Shopee', icon: '🛍️', color: '#ee4d2d' },
    lazada: { name: 'Lazada', icon: '🏪', color: '#0f156d' },
    tiktok: { name: 'TikTok', icon: '🎵', color: '#000000' },
    amazon: { name: 'Amazon', icon: '📦', color: '#ff9900' },
    facebook: { name: 'Facebook', icon: '👥', color: '#4267B2' },
    ebay: { name: 'eBay', icon: '🏷️', color: '#0064d2' }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setError('');

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const uploadToImgur = async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await axios.post(
      'https://api.imgur.com/3/image',
      formData,
      {
        headers: { 'Authorization': 'Client-ID 4e960e7a2894a93' }
      }
    );
    return response.data.data.link;
  };

  const generatePackage = async () => {
    if (!productName.trim()) {
      setError('Please enter a product name');
      return;
    }

    if (selectedOptions.video && !selectedFile) {
      setError('Please upload an image for video generation');
      return;
    }

    if (!selectedOptions.descriptions && !selectedOptions.video && !selectedOptions.voice) {
      setError('Select at least one item to generate');
      return;
    }

    setGenerating(true);
    setError('');
    setResults({ descriptions: null, video: null, voice: null });

    const token = localStorage.getItem('tindahan_token');
    const itemsToGenerate = [];
    if (selectedOptions.descriptions) itemsToGenerate.push('descriptions');
    if (selectedOptions.video) itemsToGenerate.push('video');
    if (selectedOptions.voice) itemsToGenerate.push('voice');

    setProgress({ current: 0, total: itemsToGenerate.length, status: 'Starting...' });

    for (let i = 0; i < itemsToGenerate.length; i++) {
      const item = itemsToGenerate[i];
      
      try {
        setProgress({ current: i, total: itemsToGenerate.length, status: `Generating ${item}...` });

        if (item === 'descriptions') {
          const descResults = [];
          for (const platform of selectedPlatforms) {
            const prompt = `Write a ${platform} product description for: ${productName}. Features: ${features || 'High quality'}`;
            const response = await axios.post(
              'https://tindahan-ai-production.up.railway.app/api/compare',
              { question: prompt },
              { headers: { 'Authorization': `Bearer ${token}` } }
            );
            descResults.push({
              platform,
              text: response.data.data,
              icon: platformInfo[platform].icon,
              color: platformInfo[platform].color
            });
          }
          setResults(prev => ({ ...prev, descriptions: descResults }));
        }

        if (item === 'video') {
          const imageUrl = await uploadToImgur(selectedFile);
          const response = await axios.post(
            'https://tindahan-ai-production.up.railway.app/api/video/generate',
            { imageUrl },
            { headers: { 'Authorization': `Bearer ${token}` } }
          );
          setResults(prev => ({ ...prev, video: response.data.videoUrl }));
        }

        if (item === 'voice') {
          const scriptResponse = await axios.post(
            'https://tindahan-ai-production.up.railway.app/api/voice/generate-script',
            { productName, features, language: voiceLanguage.startsWith('fil') ? 'fil' : 'en' },
            { headers: { 'Authorization': `Bearer ${token}` } }
          );

          const voiceResponse = await axios.post(
            'https://tindahan-ai-production.up.railway.app/api/voice/generate',
            { 
              text: scriptResponse.data.script, 
              language: voiceLanguage, 
              gender: voiceGender 
            },
            { 
              headers: { 'Authorization': `Bearer ${token}` },
              responseType: 'blob'
            }
          );

          const url = URL.createObjectURL(voiceResponse.data);
          setResults(prev => ({ 
            ...prev, 
            voice: { 
              url, 
              script: scriptResponse.data.script 
            } 
          }));
        }

        setProgress({ current: i + 1, total: itemsToGenerate.length, status: `${item} complete!` });

      } catch (err) {
        console.error(`Failed to generate ${item}:`, err);
        setError(`${item} generation failed. Continuing with next item...`);
      }
    }

    setProgress({ current: itemsToGenerate.length, total: itemsToGenerate.length, status: 'Complete!' });
    setGenerating(false);
  };

  const togglePlatform = (platform) => {
    if (selectedPlatforms.includes(platform)) {
      setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
    } else {
      setSelectedPlatforms([...selectedPlatforms, platform]);
    }
  };

  const handleReset = () => {
    if (results.voice?.url?.startsWith('blob:')) {
      URL.revokeObjectURL(results.voice.url);
    }
    setResults({ descriptions: null, video: null, voice: null });
    setProductName('');
    setFeatures('');
    setSelectedFile(null);
    setImagePreview(null);
    setError('');
  };

    return (
    <div className="package-wrapper">
      <div className="package-split">
        {/* LEFT: Form Panel */}
        <div className="package-form-panel">
          <h2 className="package-title">📦 Package Generator</h2>
          
          {generating && (
            <div className="package-progress">
              <div className="package-progress-bar">
                <div 
                  className="package-progress-fill" 
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
              <p className="package-progress-text">{progress.status}</p>
            </div>
          )}

          {/* Product Details */}
          <div className="package-section">
            <div className="package-section-header">
              <h3>PRODUCT DETAILS</h3>
              <span>Required for generation</span>
            </div>

            <div className="package-input-group">
              <label>Product Name *</label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g., Wireless Bluetooth Earbuds"
                className="package-input"
              />
            </div>

            <div className="package-input-group">
              <label>Features (Optional)</label>
              <textarea
                value={features}
                onChange={(e) => setFeatures(e.target.value)}
                placeholder="e.g., Noise cancellation, 20-hour battery, waterproof..."
                className="package-textarea"
                rows="2"
              />
            </div>

            {selectedOptions.video && (
              <div className="package-upload-section">
                <label>Product Image (for video)</label>
                {!imagePreview ? (
                  <div className="package-upload-box" onClick={() => fileInputRef.current.click()}>
                    <div className="package-upload-icon">📸</div>
                    <p>Click to upload image</p>
                    <small>PNG, JPG up to 10MB</small>
                  </div>
                ) : (
                  <div className="package-preview">
                    <img src={imagePreview} alt="Preview" />
                    <button 
                      onClick={() => {
                        setSelectedFile(null);
                        setImagePreview(null);
                      }}
                      className="package-preview-remove"
                    >
                      ✕
                    </button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </div>
            )}
          </div>

          {/* What to Generate */}
          <div className="package-section">
            <div className="package-section-header">
              <h3>WHAT TO GENERATE?</h3>
              <span>Select items</span>
            </div>

            {/* Descriptions Option */}
            <div className="package-option">
              <label className="package-checkbox">
                <input
                  type="checkbox"
                  checked={selectedOptions.descriptions}
                  onChange={(e) => setSelectedOptions({ ...selectedOptions, descriptions: e.target.checked })}
                />
                <span className="package-checkbox-label">
                  <span className="package-option-icon">📝</span>
                  Product Descriptions
                </span>
              </label>
              
              {selectedOptions.descriptions && (
                <div className="package-sub-options">
                  <p className="package-sub-title">Select Platforms:</p>
                  <div className="package-platform-grid">
                    {Object.entries(platformInfo).map(([key, info]) => (
                      <button
                        key={key}
                        className={`package-platform-btn ${selectedPlatforms.includes(key) ? 'active' : ''}`}
                        onClick={() => togglePlatform(key)}
                        style={selectedPlatforms.includes(key) ? { 
                          background: `linear-gradient(135deg, ${info.color}, #6a5cff)`,
                          borderColor: info.color
                        } : {}}
                      >
                        <span>{info.icon}</span>
                        {info.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Video Option */}
            <div className="package-option">
              <label className="package-checkbox">
                <input
                  type="checkbox"
                  checked={selectedOptions.video}
                  onChange={(e) => setSelectedOptions({ ...selectedOptions, video: e.target.checked })}
                />
                <span className="package-checkbox-label">
                  <span className="package-option-icon">🎬</span>
                  AI Video (3-5 seconds)
                </span>
              </label>
            </div>

            {/* Voice Option */}
            <div className="package-option">
              <label className="package-checkbox">
                <input
                  type="checkbox"
                  checked={selectedOptions.voice}
                  onChange={(e) => setSelectedOptions({ ...selectedOptions, voice: e.target.checked })}
                />
                <span className="package-checkbox-label">
                  <span className="package-option-icon">🎙️</span>
                  AI Voiceover
                </span>
              </label>
              
              {selectedOptions.voice && (
                <div className="package-sub-options">
                  {/* Voice Options - Premium Styling */}
                  <div className="package-voice-options-grid">
                    <div className="package-voice-option-card">
                      <div className="package-voice-option-label">
                        <span className="package-voice-label-icon">🌐</span>
                        Language
                      </div>
                      <select 
                        value={voiceLanguage} 
                        onChange={(e) => setVoiceLanguage(e.target.value)}
                        className="package-voice-select"
                      >
                        <optgroup label="🇺🇸 English">
                          <option value="en-US">English (US)</option>
                          <option value="en-GB">English (UK)</option>
                          <option value="en-AU">English (Australia)</option>
                        </optgroup>
                        <optgroup label="🇵🇭 Philippines">
                          <option value="fil-PH">Tagalog (Filipino)</option>
                          <option value="ceb-PH">Cebuano (Bisaya)</option>
                        </optgroup>
                        <optgroup label="🇪🇸 Spanish">
                          <option value="es-ES">Spanish (Spain)</option>
                          <option value="es-MX">Spanish (Mexico)</option>
                        </optgroup>
                        <optgroup label="🇨🇳 Chinese">
                          <option value="zh-CN">Chinese (Mandarin)</option>
                          <option value="zh-TW">Chinese (Taiwan)</option>
                        </optgroup>
                        <optgroup label="🇯🇵 Japanese">
                          <option value="ja-JP">Japanese</option>
                        </optgroup>
                        <optgroup label="🇰🇷 Korean">
                          <option value="ko-KR">Korean</option>
                        </optgroup>
                      </select>
                    </div>

                    <div className="package-voice-option-card">
                      <div className="package-voice-option-label">
                        <span className="package-voice-label-icon">🎭</span>
                        Voice Style
                      </div>
                      <select 
                        value={voiceGender} 
                        onChange={(e) => setVoiceGender(e.target.value)}
                        className="package-voice-select"
                      >
                        <optgroup label="👩 Female Voices">
                          <option value="FEMALE_WARM">Warm & Friendly</option>
                          <option value="FEMALE_PROFESSIONAL">Professional & Clear</option>
                          <option value="FEMALE_ENERGETIC">Energetic & Upbeat</option>
                          <option value="FEMALE_SOFT">Soft & Gentle</option>
                        </optgroup>
                        <optgroup label="👨 Male Voices">
                          <option value="MALE_DEEP">Deep & Resonant</option>
                          <option value="MALE_PROFESSIONAL">Professional & Clear</option>
                          <option value="MALE_ENERGETIC">Energetic & Upbeat</option>
                          <option value="MALE_FRIENDLY">Friendly & Approachable</option>
                        </optgroup>
                        <optgroup label="🎵 Special Voices">
                          <option value="ROBOTIC">Robotic / AI Style</option>
                          <option value="WHISPER">Whisper / ASMR Style</option>
                          <option value="RADIO_DJ">Radio DJ Style</option>
                        </optgroup>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Generate Button */}
            <button 
              onClick={generatePackage}
              disabled={generating}
              className="package-generate-btn"
            >
              {generating ? (
                <span className="package-generating-text">
                  <span className="package-spinner-small"></span>
                  Generating {progress.current}/{progress.total}...
                </span>
              ) : (
                '🚀 GENERATE PACKAGE'
              )}
            </button>

            {error && <div className="package-error">{error}</div>}
          </div>
        </div>

        {/* RIGHT: Results Panel */}
        <div className="package-results-panel">
          {!generating && !results.descriptions && !results.video && !results.voice && (
            <div className="package-empty">
              <div className="package-empty-icon">📦</div>
              <p>Your package will appear here</p>
            </div>
          )}

          {(results.descriptions || results.video || results.voice) && (
            <>
              <div className="package-results-header">
                <h3>Your Package</h3>
                <button onClick={handleReset} className="package-reset-btn">
                  New Package
                </button>
              </div>

              <div className="package-results-scroll">
                {results.descriptions && (
                  <div className="package-result-group">
                    <h4 className="package-result-title">
                      <span>📝</span> Descriptions ({results.descriptions.length} platforms)
                    </h4>
                    <div className="package-description-list">
                      {results.descriptions.map((desc, i) => (
                        <div key={i} className="package-description-card">
                          <div className="package-description-header">
                            <span>{desc.icon}</span>
                            <span className="package-description-platform">{platformInfo[desc.platform]?.name}</span>
                          </div>
                          <p className="package-description-text">{desc.text.substring(0, 120)}...</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {results.video && (
                  <div className="package-result-group">
                    <h4 className="package-result-title">
                      <span>🎬</span> Video
                    </h4>
                    <div className="package-video-wrapper">
                      <video src={results.video} controls className="package-video" />
                    </div>
                  </div>
                )}

                {results.voice && (
                  <div className="package-result-group">
                    <h4 className="package-result-title">
                      <span>🎙️</span> Voiceover
                    </h4>
                    <div className="package-audio-wrapper">
                      <audio src={results.voice.url} controls className="package-audio" />
                      <p className="package-script-preview">
                        "{results.voice.script.substring(0, 100)}..."
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllInOneGenerator;