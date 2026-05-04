import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import { getMe } from './api/userService';
import './index.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getMe();
        setUser(userData);
      } catch (error) {
        // Not logged in or token expired
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
  }, []);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#eef2f5' }}>
      <p style={{ color: '#00a884', fontSize: '18px' }}>Loading WhatsApp...</p>
    </div>;
  }

  return (
    <Router>
      <div className="app">
        <Routes>
          <Route 
            path="/login" 
            element={!user ? <LoginPage setUser={setUser} /> : <Navigate to="/" />} 
          />
          <Route 
            path="/" 
            element={user ? <HomePage user={user} setUser={setUser} /> : <Navigate to="/login" />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
