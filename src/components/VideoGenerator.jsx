import React, { useState, useEffect, useRef } from 'react';
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
  const fileInputRef = useRef(null);

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
      setError('Please upload an image file');
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

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleChangeImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setGeneratedVideo(null);
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
      setError('Please select an image first');
      return;
    }

    setGenerating(true);
    setError('');
    setUploadProgress(0);

    try {
      setError('Uploading...');
      const imageUrl = await uploadToImgur(selectedFile);
      
      setError('Generating video... 30-60 seconds ⏳');
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
        setError(err.response.data.message || 'Limit reached!');
      } else if (err.code === 'ECONNABORTED') {
        setError('Timeout. Check back in a minute.');
      } else {
        setError('Failed. Please try again.');
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
    <div className="video-wrapper">
      <div className="video-split">
        {/* LEFT: Upload */}
        <div className="video-form-panel">
          <h2 className="video-title">🎬 Generate Video</h2>
          
          {usage && (
            <div className="video-usage">
              🎥 {usage.remaining}/{usage.limit} left today
            </div>
          )}

          <div className="video-upload-section">
            <div className="video-upload-header">
              <h3>UPLOAD IMAGE</h3>
              <span>PNG, JPG up to 10MB</span>
            </div>

            {!imagePreview ? (
              <div className="video-upload-box" onClick={handleUploadClick}>
                <div className="video-upload-icon">📸</div>
                <h4>Choose a file or drag & drop here</h4>
                <p>Upload an image to generate your video</p>
                <button className="video-select-btn">
                  <span>📁</span> Select File
                </button>
                <div className="video-upload-hint">PNG, JPG up to 10MB</div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </div>
            ) : (
              <div className="video-preview-container">
                <img src={imagePreview} alt="Preview" />
                <div className="video-preview-overlay">
                  <span>✅ Image uploaded</span>
                  <button onClick={handleChangeImage} className="video-change-btn">
                    Change
                  </button>
                </div>
              </div>
            )}
          </div>

          {selectedFile && !generating && !generatedVideo && (
            <button onClick={handleGenerate} className="video-generate-btn">
              Generate Video 🎬
            </button>
          )}

          {generating && (
            <div className="video-generating">
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="video-progress">
                  <div className="video-progress-fill" style={{ width: `${uploadProgress}%` }} />
                </div>
              )}
              <div className="video-spinner"></div>
              <p>{error || 'Creating your video...'}</p>
              <p className="video-hint">This may take up to 60 seconds</p>
            </div>
          )}

          {error && !generating && (
            <div className="video-error">
              {error}
              {error.includes('limit') && (
                <a href="#pricing" className="video-upgrade-link">Upgrade Now →</a>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: Result */}
        <div className="video-results-panel">
          {generatedVideo ? (
            <>
              <div className="video-results-header">
                <h3>Your Video</h3>
              </div>
              <div className="video-result-container">
                <div className="video-player-wrapper">
                  <video src={generatedVideo} controls autoPlay loop className="video-player" />
                </div>
                <div className="video-action-buttons">
                  <button onClick={downloadVideo} className="video-download-btn">
                    ⬇️ Download
                  </button>
                  <button 
                    onClick={handleChangeImage}
                    className="video-new-btn"
                  >
                    New Video
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="video-empty">
              <div className="video-empty-icon">🎬</div>
              <p>Your video will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoGenerator;