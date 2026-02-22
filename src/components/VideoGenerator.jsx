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
    <div className="gen-wrapper">
      <div className="gen-split">
        {/* LEFT: Upload */}
        <div className="gen-form-panel">
          <h2 className="gen-title">🎬 Generate Video</h2>
          
          {usage && (
            <div className="gen-usage">
              🎥 {usage.remaining}/{usage.limit} left today
            </div>
          )}

          <div className="video-upload-area">
            {!imagePreview ? (
              <label htmlFor="video-upload" className="video-upload-label">
                <div className="video-upload-icon">📸</div>
                <p className="video-upload-text">UPLOAD HERE</p>
                <span className="video-upload-hint">PNG, JPG up to 10MB</span>
              </label>
            ) : (
              <div className="video-preview-img">
                <img src={imagePreview} alt="Product" />
                <button 
                  onClick={() => {
                    setSelectedFile(null);
                    setImagePreview(null);
                    setGeneratedVideo(null);
                  }}
                  className="video-change-btn"
                >
                  Change
                </button>
              </div>
            )}
            <input
              id="video-upload"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>

          {selectedFile && !generating && !generatedVideo && (
            <button onClick={handleGenerate} className="gen-btn">
              Generate Video 🎬
            </button>
          )}

          {generating && (
            <div className="video-generating">
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="video-progress-bar">
                  <div className="video-progress-fill" style={{ width: `${uploadProgress}%` }} />
                </div>
              )}
              <div className="loading-spinner"></div>
              <p>{error || 'Creating...'}</p>
            </div>
          )}

          {error && !generating && (
            <div className="gen-error">{error}</div>
          )}
        </div>

        {/* RIGHT: Result */}
        <div className="gen-results-panel">
          {generatedVideo ? (
            <>
              <div className="gen-results-header">
                <h3>Your Video</h3>
              </div>
              <div className="video-result-area">
                <video src={generatedVideo} controls autoPlay loop className="video-player">
                  Your browser doesn't support video.
                </video>
                <div className="video-actions">
                  <button onClick={downloadVideo} className="gen-btn">
                    ⬇️ Download
                  </button>
                  <button 
                    onClick={() => {
                      setGeneratedVideo(null);
                      setSelectedFile(null);
                      setImagePreview(null);
                    }}
                    className="gen-reset"
                  >
                    New Video
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="gen-empty">
              <div className="gen-empty-icon">🎬</div>
              <p>Your video will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoGenerator;