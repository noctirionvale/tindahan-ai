import React, { useState, useRef } from 'react';
import axios from 'axios';
import './ProfilePictureUpload.css';

const ProfilePictureUpload = ({ user, onUpdate }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(user?.avatar_url || null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const SUPPORTED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!SUPPORTED_FORMATS.includes(file.type)) {
      setError('Please use JPG, PNG, GIF, or WebP');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setError('');

    // Use blob URL for preview — avoids the data: URI CSP violation
    const blobUrl = URL.createObjectURL(file);
    setPreview(blobUrl);

    uploadAvatar(file);
  };

  const uploadAvatar = async (file) => {
    setUploading(true);

    try {
      const token = localStorage.getItem('tindahan_token');

      // Single call to your backend — it handles Imgur server-side (no CORS issue)
      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post(
        'https://tindahan-ai-production.up.railway.app/api/user/avatar/upload',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      const { user: updatedUser } = response.data;

      // Swap blob preview for the real Imgur URL
      setPreview(updatedUser.avatar_url);

      // Persist to localStorage
      const stored = JSON.parse(localStorage.getItem('tindahan_user') || '{}');
      const merged = { ...stored, avatar_url: updatedUser.avatar_url };
      localStorage.setItem('tindahan_user', JSON.stringify(merged));

      if (onUpdate) {
        onUpdate(merged);
      }

    } catch (err) {
      setError('Failed to upload image. Please try again.');
      setPreview(user?.avatar_url || null); // revert on failure
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="profile-picture-upload">
      <div
        className="profile-avatar-large"
        onClick={() => fileInputRef.current.click()}
        style={{ cursor: 'pointer' }}
      >
        {preview ? (
          <img src={preview} alt="Profile" />
        ) : (
          <span>{user?.name?.charAt(0).toUpperCase()}</span>
        )}

        {uploading && (
          <div className="profile-avatar-overlay">
            <div className="spinner-small"></div>
          </div>
        )}
      </div>

      <button
        className="change-photo-btn"
        onClick={() => fileInputRef.current.click()}
        disabled={uploading}
      >
        {uploading ? 'Uploading...' : 'Change Photo'}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {error && <p className="profile-error">{error}</p>}
    </div>
  );
};

export default ProfilePictureUpload;