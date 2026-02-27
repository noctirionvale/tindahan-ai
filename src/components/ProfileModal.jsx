import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProfilePictureUpload from './ProfilePictureUpload';
import './ProfileModal.css';

const ProfileModal = ({ user, setUser, onClose, onLogout, onNavigateToPricing }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || '');
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
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
      if (response.data.success) setUsage(response.data.usage);
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
        { currentPassword: passwords.current, newPassword: passwords.new },
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

  const handleGoToPricing = () => {
    onClose();
    if (onNavigateToPricing) {
      onNavigateToPricing();
    } else {
      // fallback: scroll to pricing section
      setTimeout(() => {
        const el = document.getElementById('pricing');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
        else window.location.hash = '#pricing';
      }, 100);
    }
  };

  const tabs = [
    { id: 'profile', label: '🧑 Profile' },
    { id: 'usage', label: '📊 Usage' },
    { id: 'settings', label: '⚙️ Settings' },
    { id: 'billing', label: '💳 Billing' }
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

        {/* Header */}
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

          {/* ===== PROFILE TAB ===== */}
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
                    <button className="save-btn" onClick={handleUpdateName} disabled={loading}>
                      {loading ? 'Saving...' : 'Save'}
                    </button>
                    <button className="cancel-btn" onClick={() => { setIsEditing(false); setEditedName(user?.name); }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Logout ONLY on Profile tab */}
              <button className="profile-logout-btn" onClick={onLogout}>
                🚪 Logout
              </button>
            </div>
          )}

          {/* ===== USAGE TAB ===== */}
          {activeTab === 'usage' && usage && (
            <div className="profile-section">
              <h3>Usage Statistics</h3>
              <div className="usage-stats">
                {[
                  { label: '📝 Descriptions', key: 'descriptions' },
                  { label: '🎬 Videos', key: 'videos' },
                  { label: '🎙️ Voices', key: 'voices' }
                ].map(({ label, key }) => (
                  <div className="stat-item" key={key}>
                    <div className="stat-header">
                      <span>{label}</span>
                      <span>{usage[key].used} / {usage[key].limit}</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${Math.min((usage[key].used / usage[key].limit) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
                <div className="usage-note">
                  <p>⏰ Resets daily at midnight</p>
                </div>
              </div>
            </div>
          )}

          {/* ===== SETTINGS TAB ===== */}
          {activeTab === 'settings' && (
            <div className="profile-section">
              <h3>Change Password</h3>
              <div className="password-form">
                {[
                  { label: 'Current Password', key: 'current', placeholder: 'Enter current password' },
                  { label: 'New Password', key: 'new', placeholder: 'Enter new password' },
                  { label: 'Confirm New Password', key: 'confirm', placeholder: 'Confirm new password' }
                ].map(({ label, key, placeholder }) => (
                  <div className="field" key={key}>
                    <label>{label}</label>
                    <input
                      type="password"
                      value={passwords[key]}
                      onChange={(e) => setPasswords({ ...passwords, [key]: e.target.value })}
                      className="profile-input"
                      placeholder={placeholder}
                    />
                  </div>
                ))}
                <button className="update-btn" onClick={handleUpdatePassword} disabled={loading}>
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

          {/* ===== BILLING TAB ===== */}
          {activeTab === 'billing' && (
            <div className="profile-section">
              <h3>Subscription</h3>
              <div className="current-plan">
                <div className="plan-name">
                  <span>Current Plan: <strong style={{ color: getPlanColor(user?.plan) }}>{user?.plan || 'Free'}</strong></span>
                  <button className="upgrade-btn" onClick={handleGoToPricing}>Upgrade</button>
                </div>

                {user?.plan && user.plan !== 'free' && (
                  <>
                    <div className="billing-info">
                      <div className="info-row">
                        <span>Next billing date:</span>
                        <span>{user?.plan_expires_at ? new Date(user.plan_expires_at).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}</span>
                      </div>
                    </div>
                    <button className="cancel-subscription">Cancel Subscription</button>
                  </>
                )}

                {(!user?.plan || user.plan === 'free') && (
                  <div className="upgrade-prompt">
                    <p>Upgrade to Starter for more generations!</p>
                    <button className="upgrade-now-btn" onClick={handleGoToPricing}>
                      View Plans
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Message */}
          {message.text && (
            <div className={`profile-message ${message.type}`}>
              {message.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;