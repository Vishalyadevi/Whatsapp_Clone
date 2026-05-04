import React, { useState } from 'react';
import { loginUser, registerUser } from '../../api/userService';

const Login = ({ setUser }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isRegistering && (!formData.email || !formData.username || !formData.password)) {
      setError('Please fill in all fields');
      return;
    }

    if (!isRegistering && (!formData.email || !formData.password)) {
      setError('Please fill in all fields');
      return;
    }

    try {
      let userData;
      if (isRegistering) {
        userData = await registerUser({
          email: formData.email,
          username: formData.username,
          password: formData.password
        });
      } else {
        userData = await loginUser({
          email: formData.email,
          password: formData.password
        });
      }
      
      setUser(userData);
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed. Please try again.');
    }
  };

  return (
    <div className="login-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#eef2f5' }}>
      <div className="login-card" style={{ backgroundColor: 'white', padding: '40px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '400px', textAlign: 'center' }}>
        <h1 style={{ color: '#00a884', marginBottom: '10px' }}>WhatsApp Web</h1>
        <p style={{ marginBottom: '20px', color: '#667781' }}>
          {isRegistering ? 'Create an account' : 'Sign in to start messaging'}
        </p>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {isRegistering && (
            <input 
              type="text" 
              name="username"
              placeholder="Username" 
              value={formData.username}
              onChange={handleChange}
              style={{ padding: '12px', borderRadius: '5px', border: '1px solid #d1d7db', fontSize: '15px' }}
            />
          )}
          <input 
            type="email" 
            name="email"
            placeholder="Email address" 
            value={formData.email}
            onChange={handleChange}
            style={{ padding: '12px', borderRadius: '5px', border: '1px solid #d1d7db', fontSize: '15px' }}
          />
          <input 
            type="password" 
            name="password"
            placeholder="Password" 
            value={formData.password}
            onChange={handleChange}
            style={{ padding: '12px', borderRadius: '5px', border: '1px solid #d1d7db', fontSize: '15px' }}
          />
          
          {error && <p style={{ color: '#ef4444', margin: '0', fontSize: '14px', textAlign: 'left' }}>{error}</p>}
          
          <button type="submit" style={{ backgroundColor: '#00a884', color: 'white', padding: '12px', border: 'none', borderRadius: '5px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
            {isRegistering ? 'Register' : 'Log In'}
          </button>
        </form>
        
        <div style={{ marginTop: '20px', fontSize: '14px', color: '#54656f' }}>
          {isRegistering ? 'Already have an account? ' : "Don't have an account? "}
          <span 
            onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
            style={{ color: '#00a884', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {isRegistering ? 'Log in' : 'Register'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Login;
