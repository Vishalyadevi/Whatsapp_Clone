import React, { useState, useRef } from 'react';
import { updateProfile } from '../../api/userService';
import { X, Camera } from 'lucide-react';

const ProfileModal = ({ user, setUser, onClose }) => {
  const [username, setUsername] = useState(user.username || '');
  const [status, setStatus] = useState(user.status || '');
  const [profilePic, setProfilePic] = useState(null);
  const [preview, setPreview] = useState(user.profilePic ? `http://localhost:5000${user.profilePic}` : '');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setProfilePic(e.target.files[0]);
      setPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const updatedUser = await updateProfile({ username, status, profilePic });
      setUser(updatedUser);
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(255,255,255,0.9)', zIndex: 1000, display: 'flex' }}>
      <div style={{ width: '400px', backgroundColor: '#f0f2f5', height: '100%', borderRight: '1px solid #d1d7db', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: '108px', backgroundColor: '#008069', color: 'white', display: 'flex', alignItems: 'flex-end', padding: '20px', gap: '20px' }}>
          <X size={24} style={{ cursor: 'pointer' }} onClick={onClose} />
          <h1 style={{ fontSize: '19px', fontWeight: 500 }}>Profile</h1>
        </div>
        
        <div style={{ padding: '28px 0', display: 'flex', justifyContent: 'center', backgroundColor: '#f0f2f5' }}>
          <div 
            style={{ width: '200px', height: '200px', borderRadius: '50%', backgroundColor: '#dfe5e7', overflow: 'hidden', position: 'relative', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            onClick={() => fileInputRef.current?.click()}
          >
            {preview ? (
              <img src={preview} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Camera size={40} color="#8696a0" />
            )}
            <div style={{ position: 'absolute', bottom: 0, width: '100%', height: '30%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontSize: '13px' }}>
              CHANGE
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '14px 30px', marginBottom: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <label style={{ color: '#008069', fontSize: '14px', marginBottom: '14px', display: 'block' }}>Your name</label>
          <input 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: '100%', border: 'none', borderBottom: '2px solid #008069', paddingBottom: '8px', fontSize: '17px', outline: 'none' }}
          />
        </div>

        <div style={{ padding: '14px 30px', color: '#8696a0', fontSize: '14px' }}>
          This is not your username or pin. This name will be visible to your WhatsApp contacts.
        </div>

        <div style={{ backgroundColor: 'white', padding: '14px 30px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <label style={{ color: '#008069', fontSize: '14px', marginBottom: '14px', display: 'block' }}>About</label>
          <input 
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{ width: '100%', border: 'none', borderBottom: '2px solid #008069', paddingBottom: '8px', fontSize: '17px', outline: 'none' }}
          />
        </div>

        <div style={{ padding: '20px', display: 'flex', justifyContent: 'center' }}>
          <button 
            onClick={handleSave}
            disabled={loading}
            style={{ backgroundColor: '#008069', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '24px', fontSize: '14px', cursor: 'pointer', fontWeight: 500 }}
          >
            {loading ? 'Saving...' : 'SAVE'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
