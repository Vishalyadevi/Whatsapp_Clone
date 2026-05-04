import React from 'react';

const CustomModal = ({ isOpen, onClose, onConfirm, title, message, confirmText, cancelText, confirmColor = '#00a884' }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(255, 255, 255, 0.85)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2000,
      backdropFilter: 'blur(2px)'
    }} onClick={onClose}>
      <div 
        style={{
          width: '500px',
          backgroundColor: '#ffffff',
          borderRadius: '3px',
          boxShadow: '0 17px 50px 0 rgba(11,20,26,.19)',
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }} 
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 500, color: '#41525d' }}>{title}</h3>}
        <p style={{ margin: 0, fontSize: '14.5px', color: '#54656f', lineHeight: '20px' }}>{message}</p>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
          <button 
            onClick={onClose}
            style={{
              padding: '10px 24px',
              border: '1px solid #d1d7db',
              borderRadius: '24px',
              backgroundColor: 'transparent',
              color: '#00a884',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f6f6'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            {cancelText || 'CANCEL'}
          </button>
          <button 
            onClick={() => { onConfirm(); onClose(); }}
            style={{
              padding: '10px 24px',
              border: 'none',
              borderRadius: '24px',
              backgroundColor: confirmColor,
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              boxShadow: '0 1.5px 2.5px rgba(11,20,26,.08)'
            }}
          >
            {confirmText || 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomModal;
