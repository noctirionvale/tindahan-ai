import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './VideoGenerator.css';

const VideoGenerator = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState(null);
  const [error, setError] = useState('');
  const [usage, setUsage] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const token = localStorage.getItem('tindahan_token');
      const response = await axios.get(
        'https://tindahan-ai-production.up.railway.app/api/video/usage',
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (response.data.success) {
        setUsage(response.data.usage);
      }
    } catch (err) {
      console.error('Failed to fetch video usage:', err);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, etc.)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setError('');
    setGeneratedVideo(null);

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
        headers: { 'Authorization': 'Client-ID 4e960e7a2894a93' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      }
    );
    return response.data.data.link;
  };

  const handleGenerate = async () => {
    if (!selectedFile) {
      setError('Please select a product image first');
      return;
    }

    setGenerating(true);
    setError('');
    setUploadProgress(0);

    try {
      setError('Uploading image...');
      const imageUrl = await uploadToImgur(selectedFile);
      
      setError('Generating video... This may take 30-60 seconds ⏳');
      const token = localStorage.getItem('tindahan_token');
      
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
        setUsage({
          ...usage,
          remaining: response.data.usage.remaining,
          today: (usage?.today || 0) + 1,
          total: (usage?.total || 0) + 1
        });
        setError('');
      }

    } catch (err) {
      console.error('Video generation error:', err);
      
      if (err.response?.status === 429) {
        setError(err.response.data.message || 'Limit reached! Upgrade your plan.');
      } else if (err.code === 'ECONNABORTED') {
        setError('Request timed out. Check back in a minute.');
      } else {
        setError('Failed to generate video. Please try again.');
      }
    } finally {
      setGenerating(false);
      setUploadProgress(0);
    }
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

  return (
    <section id="video-generator" className="video-generator-section">
      <div className="video-generator-content">
        
        <div className="video-generator-header">
          <h2>🎬 AI Video Generator</h2>
          <p>Transform product images into engaging videos!</p>
          
          {usage && (
            <div className="usage-badge">
              {usage.plan === 'free' ? (
                <span>🎥 {usage.remaining} free video remaining</span>
              ) : (
                <span>🎥 {usage.remaining}/{usage.limit} videos left today</span>
              )}
            </div>
          )}
        </div>

        <div className="video-generator-container">
          
          <div className="upload-section">
            <div className="upload-box">
              {!imagePreview ? (
                <label htmlFor="image-upload" className="upload-label">
                  <div className="upload-icon">📸</div>
                  <h3>Upload Product Image</h3>
                  <p>Click or drag image here</p>
                  <span className="upload-hint">PNG, JPG up to 10MB</span>
                </label>
              ) : (
                <div className="image-preview">
                  <img src={imagePreview} alt="Product" />
                  <button 
                    onClick={() => {
                      setSelectedFile(null);
                      setImagePreview(null);
                      setGeneratedVideo(null);
                    }}
                    className="change-image-btn"
                  >
                    Change Image
                  </button>
                </div>
              )}
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>

            {selectedFile && !generating && !generatedVideo && (
              <button onClick={handleGenerate} className="generate-btn">
                Generate Video 🎬
              </button>
            )}

            {generating && (
              <div className="generating-status">
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
                    <span className="progress-text">Uploading... {uploadProgress}%</span>
                  </div>
                )}
                <div className="loading-spinner"></div>
                <p>{error || 'Creating your video...'}</p>
                <span className="generating-hint">Usually takes 30-60 seconds</span>
              </div>
            )}
          </div>

          {generatedVideo && (
            <div className="video-preview-section">
              <h3>✨ Your Video is Ready!</h3>
              <div className="video-container">
                <video src={generatedVideo} controls autoPlay loop className="generated-video">
                  Your browser doesn't support video.
                </video>
              </div>
              <div className="video-actions">
                <button onClick={downloadVideo} className="download-btn">
                  ⬇️ Download Video
                </button>
                <button 
                  onClick={() => {
                    setGeneratedVideo(null);
                    setSelectedFile(null);
                    setImagePreview(null);
                  }}
                  className="generate-another-btn"
                >
                  Generate Another
                </button>
              </div>
            </div>
          )}

          {error && !generating && (
            <div className="error-message">
              {error}
              {error.includes('limit') && (
                <a href="#pricing" className="upgrade-link"> Upgrade Now →</a>
              )}
            </div>
          )}

        </div>

        <div className="how-it-works">
          <h3>How It Works</h3>
          <div className="steps-grid">
            <div className="step">
              <span className="step-number">1</span>
              <h4>Upload Image</h4>
              <p>Choose your product photo</p>
            </div>
            <div className="step">
              <span className="step-number">2</span>
              <h4>AI Magic</h4>
              <p>We create motion & effects</p>
            </div>
            <div className="step">
              <span className="step-number">3</span>
              <h4>Download</h4>
              <p>Post to TikTok, Shopee!</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default VideoGenerator;