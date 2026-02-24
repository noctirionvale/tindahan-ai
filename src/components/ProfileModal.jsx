import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProfilePictureUpload from './ProfilePictureUpload'; // ✨ Added this import!
import './ProfileModal.css';

// ✨ Added setUser right here in the props!
const ProfileModal = ({ user, setUser, onClose, onLogout }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || '');
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchUsage();
  }, []);

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

  const handleUpdateName = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('tindahan_token');
      await axios.put(
        'https://tindahan-ai-production.up.railway.app/api/user/profile',
        { name: editedName },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setMessage({ type: 'success', text: 'Name updated successfully!' });
      setIsEditing(false);
      // Update local storage
      const updatedUser = { ...user, name: editedName };
      localStorage.setItem('tindahan_user', JSON.stringify(updatedUser));
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update name' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('tindahan_token');
      await axios.put(
        'https://tindahan-ai-production.up.railway.app/api/user/password',
        {
          currentPassword: passwords.current,
          newPassword: passwords.new
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update password' });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: '👤 Profile', icon: '👤' },
    { id: 'usage', label: '📊 Usage', icon: '📊' },
    { id: 'settings', label: '⚙️ Settings', icon: '⚙️' },
    { id: 'billing', label: '💳 Billing', icon: '💳' }
  ];

  const getPlanColor = (plan) => {
    const plans = {
      free: '#10b981',
      starter: '#8b5cf6',
      pro: '#f59e0b',
      business: '#ef4444',
      owner: '#00e5ff'
    };
    return plans[plan] || plans.free;
  };

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <button className="profile-close" onClick={onClose}>×</button>

        {/* Header - ✨ Removed the duplicate one and kept the correct one */}
        <div className="profile-header">
          <ProfilePictureUpload user={user} onUpdate={(updated) => setUser(updated)} />
          <div className="profile-header-info">
            <h2>{user?.name}</h2>
            <p>{user?.email}</p>
          </div>
        </div>

        {/* Plan Badge */}
        <div 
          className="profile-plan-badge"
          style={{ 
            background: getPlanColor(user?.plan) + '20',
            borderColor: getPlanColor(user?.plan),
            color: getPlanColor(user?.plan)
          }}
        >
          {user?.plan || 'Free'} Plan
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`profile-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="profile-content">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="profile-section">
              <h3>Profile Information</h3>
              
              {!isEditing ? (
                <div className="profile-info-display">
                  <div className="info-row">
                    <span className="info-label">Name:</span>
                    <span className="info-value">{user?.name}</span>
                    <button className="edit-btn" onClick={() => setIsEditing(true)}>✎</button>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Email:</span>
                    <span className="info-value">{user?.email}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Member since:</span>
                    <span className="info-value">
                      {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="profile-edit">
                  <div className="field">
                    <label>Name</label>
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="profile-input"
                    />
                  </div>
                  <div className="edit-actions">
                    <button 
                      className="save-btn" 
                      onClick={handleUpdateName}
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : 'Save'}
                    </button>
                    <button 
                      className="cancel-btn" 
                      onClick={() => {
                        setIsEditing(false);
                        setEditedName(user?.name);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Usage Tab */}
          {activeTab === 'usage' && usage && (
            <div className="profile-section">
              <h3>Usage Statistics</h3>
              
              <div className="usage-stats">
                <div className="stat-item">
                  <div className="stat-header">
                    <span>📝 Descriptions</span>
                    <span>{usage.descriptions.used} / {usage.descriptions.limit}</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${(usage.descriptions.used / usage.descriptions.limit) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="stat-item">
                  <div className="stat-header">
                    <span>🎬 Videos</span>
                    <span>{usage.videos.used} / {usage.videos.limit}</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${(usage.videos.used / usage.videos.limit) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="stat-item">
                  <div className="stat-header">
                    <span>🎙️ Voices</span>
                    <span>{usage.voices.used} / {usage.voices.limit}</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${(usage.voices.used / usage.voices.limit) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="usage-note">
                  <p>⏰ Resets daily at midnight</p>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="profile-section">
              <h3>Change Password</h3>
              
              <div className="password-form">
                <div className="field">
                  <label>Current Password</label>
                  <input
                    type="password"
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                    className="profile-input"
                    placeholder="Enter current password"
                  />
                </div>
                <div className="field">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={passwords.new}
                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                    className="profile-input"
                    placeholder="Enter new password"
                  />
                </div>
                <div className="field">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    className="profile-input"
                    placeholder="Confirm new password"
                  />
                </div>

                <button 
                  className="update-btn"
                  onClick={handleUpdatePassword}
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </div>

              <div className="danger-zone">
                <h4>Danger Zone</h4>
                {!showDeleteConfirm ? (
                  <button className="delete-btn" onClick={() => setShowDeleteConfirm(true)}>
                    Delete Account
                  </button>
                ) : (
                  <div className="delete-confirm">
                    <p>Are you sure? This cannot be undone.</p>
                    <div className="confirm-actions">
                      <button className="confirm-yes">Yes, Delete</button>
                      <button className="confirm-no" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <div className="profile-section">
              <h3>Subscription</h3>
              
              <div className="current-plan">
                <div className="plan-name">
                  <span>Current Plan: <strong style={{ color: getPlanColor(user?.plan) }}>{user?.plan || 'Free'}</strong></span>
                  <button className="upgrade-btn">Upgrade</button>
                </div>

                {user?.plan !== 'free' && (
                  <>
                    <div className="billing-info">
                      <div className="info-row">
                        <span>Next billing date:</span>
                        <span>April 15, 2026</span>
                      </div>
                      <div className="info-row">
                        <span>Amount:</span>
                        <span>₱599/month</span>
                      </div>
                    </div>

                    <div className="payment-method">
                      <h5>Payment Method</h5>
                      <div className="method-display">
                        <span>💳 GCash •••• 1234</span>
                        <button className="change-btn">Change</button>
                      </div>
                    </div>

                    <button className="cancel-subscription">Cancel Subscription</button>
                  </>
                )}

                {user?.plan === 'free' && (
                  <div className="upgrade-prompt">
                    <p>Upgrade to Starter for more generations!</p>
                    <button className="upgrade-now-btn" onClick={() => window.location.href = '#pricing'}>
                      View Plans
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Message Display */}
          {message.text && (
            <div className={`profile-message ${message.type}`}>
              {message.text}
            </div>
          )}

          {/* Logout Button at Bottom */}
          <button className="profile-logout-btn" onClick={onLogout}>
            🚪 Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;