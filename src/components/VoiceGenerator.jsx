import React, { useState, useRef } from 'react';
import './VideoGenerator.css';

const VideoGenerator = () => {
  const [productName, setProductName] = useState('');
  const [callToAction, setCallToAction] = useState('Order now!');
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [renderId, setRenderId] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const pollRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be under 10MB');
      return;
    }
    setSelectedFile(file);
    setError('');
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const uploadToImgur = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch('https://api.imgur.com/3/image', {
      method: 'POST',
      headers: {
        'Authorization': 'Client-ID 4e960e7a2894a93'
      },
      body: formData
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.data?.error || 'Imgur upload failed');
    }
    return data.data.link;
  };

  const pollStatus = (id, token) => {
    pollRef.current = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/generate/video-status?renderId=${id}`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        const { status, url } = await response.json();
        setStatus(status);

        if (status === 'succeeded' && url) {
          clearInterval(pollRef.current);
          setVideoUrl(url);
          setGenerating(false);
          setStatus('');
        } else if (status === 'failed') {
          clearInterval(pollRef.current);
          setError('Video generation failed. Please try again.');
          setGenerating(false);
        }
      } catch (err) {
        clearInterval(pollRef.current);
        setGenerating(false);
        setError('Failed to check video status.');
      }
    }, 3000);
  };

  const handleGenerate = async () => {
    if (!selectedFile) {
      setError('Please upload a product image');
      return;
    }
    if (!productName.trim()) {
      setError('Please enter a product name');
      return;
    }

    setGenerating(true);
    setError('');
    setVideoUrl(null);
    setStatus('Uploading image...');

    try {
      const token = localStorage.getItem('tindahan_token');

      // Upload image to Imgur first
      const imageUrl = await uploadToImgur(selectedFile);
      setStatus('Generating video...');

      // Call Creatomate via our API using fetch
      const response = await fetch('/api/generate/video', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageUrl,
          caption: productName,
          callToAction
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Video generation failed');
      }

      if (result.success) {
        const id = result.renderId;
        setRenderId(id);

        // If already done
        if (result.url) {
          setVideoUrl(result.url);
          setGenerating(false);
          setStatus('');
        } else {
          // Poll for completion
          setStatus('Rendering video (30-60 seconds)...');
          pollStatus(id, token);
        }
      }
    } catch (err) {
      console.error('Video error:', err);
      if (err.message?.includes('429') || err.message?.includes('limit')) {
        setError("You've used your free video generation. Upgrade to get more!");
      } else {
        setError('Failed to generate video. Please try again.');
      }
      setGenerating(false);
      setStatus('');
    }
  };

  const handleReset = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setSelectedFile(null);
    setImagePreview(null);
    setVideoUrl(null);
    setRenderId(null);
    setStatus('');
    setError('');
    setProductName('');
    setCallToAction('Order now!');
  };

  return (
    <div className="video-wrapper">
      <div className="video-split">
        {/* LEFT: Form */}
        <div className="video-form-panel">
          <h2 className="video-title">🎬 Generate Video Ad</h2>
          <p className="video-subtitle">
            Upload your product photo and get a professional video ad in seconds!
          </p>

          {/* Image Upload */}
          <div className="video-section">
            <div className="video-section-header">
              <h3>PRODUCT IMAGE</h3>
              <span>Required</span>
            </div>

            {!imagePreview ? (
              <div
                className="video-upload-box"
                onClick={() => fileInputRef.current.click()}
              >
                <div className="video-upload-icon">📸</div>
                <p>Click to upload product photo</p>
                <small>JPG, PNG up to 10MB</small>
              </div>
            ) : (
              <div className="video-preview-wrapper">
                <img src={imagePreview} alt="Preview" className="video-preview-img" />
                <button className="video-remove-btn" onClick={() => {
                  setSelectedFile(null);
                  setImagePreview(null);
                }}>✕ Remove</button>
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

          {/* Product Details */}
          <div className="video-section">
            <div className="video-section-header">
              <h3>VIDEO TEXT</h3>
              <span>Customize your ad</span>
            </div>

            <div className="video-input-group">
              <label>Product Name / Caption *</label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g., Nora Treatment Oil"
                className="video-input"
              />
            </div>

            <div className="video-input-group">
              <label>Call To Action</label>
              <input
                type="text"
                value={callToAction}
                onChange={(e) => setCallToAction(e.target.value)}
                placeholder="e.g., Order now! Visit our store today"
                className="video-input"
              />
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="video-generate-btn"
          >
            {generating ? (
              <span>⏳ {status || 'Generating...'}</span>
            ) : (
              '🎬 Generate Video Ad'
            )}
          </button>

          {error && (
            <div className="video-error">
              {error}
              {error.includes('free') && (
                <a href="#pricing" className="video-upgrade-link">Upgrade Now →</a>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: Result */}
        <div className="video-results-panel">
          {!generating && !videoUrl && (
            <div className="video-empty">
              <div className="video-empty-icon">🎬</div>
              <p>Your video ad will appear here</p>
              <p className="video-empty-sub">
                Powered by Creatomate — professional video ads in seconds
              </p>
            </div>
          )}

          {generating && (
            <div className="video-generating">
              <div className="video-spinner"></div>
              <p>{status || 'Generating your video...'}</p>
              <p className="video-hint">This usually takes 30-60 seconds</p>
            </div>
          )}

          {videoUrl && !generating && (
            <div className="video-result">
              <div className="video-result-header">
                <h3>Your Video Ad ✅</h3>
              </div>
              <video
                src={videoUrl}
                controls
                autoPlay
                loop
                className="video-player"
              />
              <div className="video-action-buttons">
                <a
                  href={videoUrl}
                  download={`tindahan-video-${Date.now()}.mp4`}
                  className="video-download-btn"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ⬇️ Download Video
                </a>
                <button onClick={handleReset} className="video-new-btn">
                  New Video
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoGenerator;