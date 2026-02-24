import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './AllInOneGenerator.css';

const AllInOneGenerator = () => {
  // ===== STATE FROM ALL THREE GENERATORS =====
  // Product Description State
  const [productName, setProductName] = useState('');
  const [features, setFeatures] = useState('');
  const [platforms, setPlatforms] = useState(['shopee', 'lazada', 'tiktok']);
  const [descriptions, setDescriptions] = useState([]);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Video State
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [generatedVideo, setGeneratedVideo] = useState(null);
  const fileInputRef = useRef(null);

  // Voice State
  const [script, setScript] = useState('');
  const [language, setLanguage] = useState('en-US');
  const [gender, setGender] = useState('FEMALE');
  const [generatedAudio, setGeneratedAudio] = useState(null);
  const [audioBlobUrl, setAudioBlobUrl] = useState(null);
  const audioRef = useRef(null);

  // Shared State
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 0, status: '' });
  const [usage, setUsage] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState({
    descriptions: true,
    video: true,
    voice: true
  });

  // Platform Info
  const platformInfo = {
    shopee: { name: 'Shopee', icon: '🛍️', color: '#ee4d2d' },
    lazada: { name: 'Lazada', icon: '🏪', color: '#0f156d' },
    tiktok: { name: 'TikTok Shop', icon: '🎵', color: '#000000' },
    amazon: { name: 'Amazon', icon: '📦', color: '#ff9900' },
    facebook: { name: 'Facebook Marketplace', icon: '👥', color: '#4267B2' },
    ebay: { name: 'eBay', icon: '🏷️', color: '#0064d2' }
  };

  // Supported image formats
  const SUPPORTED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  // ===== EFFECTS =====
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
      audioRef.current.play().catch(err => console.log('Autoplay prevented:', err));
    }
  }, [audioBlobUrl]);

  // ===== API FUNCTIONS =====
  const fetchUsage = async () => {
    try {
      const token = localStorage.getItem('tindahan_token');
      const response = await axios.get(
        'https://tindahan-ai-production.up.railway.app/api/user/usage',
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (response.data.success) {
        setUsage(response.data.usage);
      }
    } catch (err) {
      console.error('Failed to fetch usage:', err);
    }
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

  // ===== HANDLERS =====
  const handlePlatformToggle = (platform) => {
    if (platforms.includes(platform)) {
      setPlatforms(platforms.filter(p => p !== platform));
    } else {
      setPlatforms([...platforms, platform]);
    }
  };

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Format validation
    if (!SUPPORTED_FORMATS.includes(file.type)) {
      setError('Unsupported format. Please use JPG, PNG, GIF, or WebP.');
      return;
    }

    // Size validation
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setError('');
    setGeneratedVideo(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Optional dimension validation
        if (img.width < 100 || img.height < 100) {
          setError('Image is too small. Minimum 100x100 pixels.');
          setSelectedFile(null);
          return;
        }
        
        setImagePreview(e.target.result);
        setError('');
      };
      
      img.onerror = () => {
        setError('Invalid or corrupted image file. Please try another.');
        setSelectedFile(null);
        setImagePreview(null);
      };
      
      img.src = e.target.result;
    };
    
    reader.onerror = () => {
      setError('Failed to read file. Please try again.');
      setSelectedFile(null);
    };
    
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    if (audioBlobUrl && audioBlobUrl.startsWith('blob:')) {
      URL.revokeObjectURL(audioBlobUrl);
    }
    setDescriptions([]);
    setGeneratedVideo(null);
    setGeneratedAudio(null);
    setAudioBlobUrl(null);
    setScript('');
    setProductName('');
    setFeatures('');
    setSelectedFile(null);
    setImagePreview(null);
    setError('');
  };

  // ===== GENERATION FUNCTIONS =====
  const generateDescriptions = async (token) => {
    const descResults = [];
    
    for (const platform of platforms) {
      let prompt = '';

      if (platform === 'shopee') {
        prompt = `You are a Shopee Philippines product copywriter. Output ONLY the description. Style: Professional Taglish. Format: Product Name + Bullet points. Product: ${productName}. Features: ${features || 'High quality'}`;
      } else if (platform === 'lazada') {
        prompt = `You are a Lazada official copywriter. Style: Corporate English/Taglish. Format: Specs + Benefits. Product: ${productName}. Features: ${features || 'Safe and reliable'}`;
      } else if (platform === 'tiktok') {
        prompt = `You are a TikTok Shop caption writer. Style: Casual/Viral. Product: ${productName}. Features: ${features || 'Trending item'}`;
      } else if (platform === 'amazon') {
        prompt = `You are an Amazon listing expert. Output ONLY the listing. Style: Professional English. Format: Title + 5 bullet points + short description. SEO optimized. Product: ${productName}. Features: ${features || 'High quality product'}`;
      } else if (platform === 'facebook') {
        prompt = `You are a Facebook seller. Output ONLY the listing. Style: Warm, conversational. Format: Catchy title + description. Product: ${productName}. Features: ${features || 'Great item'}`;
      } else if (platform === 'ebay') {
        prompt = `You are an eBay listing expert. Output ONLY the listing. Style: Clear, factual, buyer-focused English. Format: Title + condition + description + why buy from us. Product: ${productName}. Features: ${features || 'Quality item'}`;
      }

      const response = await axios.post(
        'https://tindahan-ai-production.up.railway.app/api/compare',
        { question: prompt },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      descResults.push({
        platform,
        text: response.data.data,
        icon: platformInfo[platform].icon,
        color: platformInfo[platform].color,
        name: platformInfo[platform].name
      });
    }
    
    setDescriptions(descResults);
  };

  const generateVideo = async (token) => {
    const imageUrl = await uploadToImgur(selectedFile);
    
    const response = await axios.post(
      'https://tindahan-ai-production.up.railway.app/api/video/generate',
      { imageUrl },
      { 
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 120000
      }
    );

    if (response.data.success) {
      setGeneratedVideo(response.data.videoUrl);
    }
  };

  const generateVoice = async (token) => {
    // First generate script if empty
    let voiceScript = script;
    if (!voiceScript.trim()) {
      const scriptResponse = await axios.post(
        'https://tindahan-ai-production.up.railway.app/api/voice/generate-script',
        {
          productName,
          features,
          language: language.startsWith('fil') ? 'fil' : 'en'
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (scriptResponse.data.success) {
        voiceScript = scriptResponse.data.script;
        setScript(voiceScript);
      }
    }

    // Then generate voice
    const voiceResponse = await axios.post(
      'https://tindahan-ai-production.up.railway.app/api/voice/generate',
      { text: voiceScript, language, gender },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    if (voiceResponse.data.success && voiceResponse.data.audioUrl) {
      setGeneratedAudio(voiceResponse.data.audioUrl);
      
      // Convert data URI to blob URL
      const base64Data = voiceResponse.data.audioUrl.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'audio/mpeg' });
      const blobUrl = URL.createObjectURL(blob);
      setAudioBlobUrl(blobUrl);
    }
  };

  // ===== MAIN GENERATE FUNCTION =====
  const handleGeneratePackage = async () => {
    // Only validate product name if ANY option is selected
    if (!productName.trim()) {
      setError('Please enter a product name');
      return;
    }

    // Only validate image if video is selected AND they have no image
    if (selectedOptions.video && !selectedFile) {
      setError('Please upload an image for video generation');
      return;
    }

    // If no options selected, show gentle message
    if (!selectedOptions.descriptions && !selectedOptions.video && !selectedOptions.voice) {
      setError('Select what you want to generate');
      return;
    }

    setGenerating(true);
    setError('');
    handleReset(); // Clear previous results

    const token = localStorage.getItem('tindahan_token');
    const itemsToGenerate = [];
    
    // Only add items that are selected AND have required data
    if (selectedOptions.descriptions && platforms.length > 0) {
      itemsToGenerate.push('descriptions');
    }
    
    if (selectedOptions.video && selectedFile) {
      itemsToGenerate.push('video');
    }
    
    if (selectedOptions.voice) {
      itemsToGenerate.push('voice');
    }

    // If no valid items to generate (e.g., selected video but no file)
    if (itemsToGenerate.length === 0) {
      setGenerating(false);
      if (selectedOptions.video && !selectedFile) {
        setError('Upload an image to generate video');
      } else if (selectedOptions.descriptions && platforms.length === 0) {
        setError('Select at least one platform for descriptions');
      }
      return;
    }

    setProgress({ current: 0, total: itemsToGenerate.length, status: 'Starting...' });

    // Generate items in sequence
    for (let i = 0; i < itemsToGenerate.length; i++) {
      const item = itemsToGenerate[i];
      
      try {
        setProgress({ 
          current: i, 
          total: itemsToGenerate.length, 
          status: `Generating ${item}...` 
        });

        if (item === 'descriptions') {
          await generateDescriptions(token);
        } else if (item === 'video') {
          await generateVideo(token);
        } else if (item === 'voice') {
          await generateVoice(token);
        }

        setProgress({ 
          current: i + 1, 
          total: itemsToGenerate.length, 
          status: `${item} complete!` 
        });

      } catch (err) {
        console.error(`Failed to generate ${item}:`, err);
        // Show error but continue with next items
        setError(`${item} generation failed. Continuing with next items...`);
      }
    }

    setProgress({ current: itemsToGenerate.length, total: itemsToGenerate.length, status: 'Complete!' });
    setGenerating(false);
  };

  const downloadVideo = () => {
    if (!generatedVideo) return;
    const link = document.createElement('a');
    link.href = generatedVideo;
    link.download = `tindahan-video-${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    <div className="package-wrapper">
      <div className="package-split">
        {/* LEFT: Form Panel */}
        <div className="package-form-panel">
          <h2 className="package-title">📦 Package Generator</h2>
          
          {/* Usage Display */}
          {usage && (
            <div className="package-usage">
              <span>📝 {usage.descriptions.used}/{usage.descriptions.limit}</span>
              <span>🎬 {usage.videos.used}/{usage.videos.limit}</span>
              <span>🎙️ {usage.voices.used}/{usage.voices.limit}</span>
            </div>
          )}

          {/* Progress Bar */}
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
          </div>

          {/* What to Generate */}
          <div className="package-section">
            <div className="package-section-header">
              <h3>WHAT TO GENERATE?</h3>
              <span>Select any combination</span>
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
                  <p className="package-sub-title">Select Platforms (optional):</p>
                  <div className="package-platform-grid">
                    {Object.entries(platformInfo).map(([key, info]) => (
                      <button
                        key={key}
                        className={`package-platform-btn ${platforms.includes(key) ? 'active' : ''}`}
                        onClick={() => handlePlatformToggle(key)}
                        style={platforms.includes(key) ? { 
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
              
              {selectedOptions.video && !imagePreview && (
                <div className="package-upload-section">
                  <div className="package-upload-box" onClick={() => fileInputRef.current.click()}>
                    <div className="package-upload-icon">📸</div>
                    <p>Click to upload image</p>
                    <small>PNG, JPG up to 10MB</small>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                </div>
              )}

              {selectedOptions.video && imagePreview && (
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
                      {/* English Voices */}
                      {language === 'en-US' && <option value="FEMALE">Female (Warm)</option>}
                      {language === 'en-US' && <option value="MALE">Male (Professional)</option>}
                      
                      {/* Tagalog Voices */}
                      {language === 'fil-PH' && <option value="FIL-FEMALE">Babae (Female)</option>}
                      {language === 'fil-PH' && <option value="FIL-MALE">Lalaki (Male)</option>}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Generate Button */}
          <button 
            onClick={handleGeneratePackage}
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

          {/* Error Message */}
          {error && <div className="package-error">{error}</div>}
        </div>

        {/* RIGHT: Results Panel */}
        <div className="package-results-panel">
          {!generating && !descriptions.length && !generatedVideo && !audioBlobUrl && (
            <div className="package-empty">
              <div className="package-empty-icon">📦</div>
              <p>Your package will appear here</p>
            </div>
          )}

          {(descriptions.length > 0 || generatedVideo || audioBlobUrl) && (
            <>
              <div className="package-results-header">
                <h3>Your Package</h3>
                <button onClick={handleReset} className="package-reset-btn">
                  New Package
                </button>
              </div>

              <div className="package-results-scroll">
                {/* Descriptions Results */}
                {descriptions.length > 0 && (
                  <div className="package-result-group">
                    <h4 className="package-result-title">
                      <span>📝</span> Descriptions ({descriptions.length} platforms)
                    </h4>
                    <div className="package-description-list">
                      {descriptions.map((desc, i) => (
                        <div key={i} className="package-description-card">
                          <div className="package-description-header">
                            <span>{desc.icon}</span>
                            <span className="package-description-platform">{desc.name}</span>
                          </div>
                          <p className="package-description-text">{desc.text}</p>
                          <button 
                            onClick={() => handleCopy(desc.text, i)}
                            className="package-copy-btn"
                          >
                            {copiedIndex === i ? '✓' : '📋'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Video Results */}
                {generatedVideo && (
                  <div className="package-result-group">
                    <h4 className="package-result-title">
                      <span>🎬</span> Video
                    </h4>
                    <div className="package-video-wrapper">
                      <video src={generatedVideo} controls className="package-video" />
                      <button onClick={downloadVideo} className="package-download-btn">
                        ⬇️ Download
                      </button>
                    </div>
                  </div>
                )}

                {/* Voice Results */}
                {audioBlobUrl && (
                  <div className="package-result-group">
                    <h4 className="package-result-title">
                      <span>🎙️</span> Voiceover
                    </h4>
                    <div className="package-audio-wrapper">
                      <audio
                        ref={audioRef}
                        controls
                        src={audioBlobUrl}
                        className="package-audio"
                      />
                      <button onClick={downloadAudio} className="package-download-btn">
                        ⬇️ Download MP3
                      </button>
                      {script && (
                        <div className="package-script-preview">
                          <p><strong>Script:</strong> "{script.substring(0, 150)}..."</p>
                        </div>
                      )}
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