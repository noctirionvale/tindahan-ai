import React, { useState, useRef } from 'react';
import axios from 'axios';
import './ProfilePictureUpload.css';

const ProfilePictureUpload = ({ user, onUpdate }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(user?.avatar || null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const SUPPORTED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate format
    if (!SUPPORTED_FORMATS.includes(file.type)) {
      setError('Please use JPG, PNG, GIF, or WebP');
      return;
    }

    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setError('');

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
      uploadToImgur(file);
    };
    reader.readAsDataURL(file);
  };

  const uploadToImgur = async (file) => {
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post(
        'https://api.imgur.com/3/image',
        formData,
        {
          headers: { 'Authorization': 'Client-ID 4e960e7a2894a93' }
        }
      );

      const imageUrl = response.data.data.link;
      
      // Save to your backend
      const token = localStorage.getItem('tindahan_token');
      await axios.put(
        'https://tindahan-ai-production.up.railway.app/api/user/avatar',
        { avatarUrl: imageUrl },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      // Update local storage
      const updatedUser = { ...user, avatar: imageUrl };
      localStorage.setItem('tindahan_user', JSON.stringify(updatedUser));
      
      // Notify parent
      if (onUpdate) {
        onUpdate(updatedUser);
      }

    } catch (err) {
      setError('Failed to upload image');
      console.error(err);
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