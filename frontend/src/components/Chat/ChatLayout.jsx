import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { logoutUser } from '../../api/userService';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import InfoSidebar from './InfoSidebar';

const SOCKET_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';

const ChatLayout = ({ user, setUser }) => {
  const [socket, setSocket] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [showRightSidebar, setShowRightSidebar] = useState(false);
  const [activeChatMessages, setActiveChatMessages] = useState([]);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('register', user._id);
    });

    newSocket.on('onlineUsers', (users) => {
      setOnlineUsers(new Set(users));
    });

    newSocket.on('userOnline', (userId) => {
      setOnlineUsers(prev => new Set(prev).add(userId));
    });

    newSocket.on('userOffline', (userId) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    return () => newSocket.close();
  }, [user]);


  const handleLogout = async () => {
    try {
      await logoutUser();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="app-container">
      <Sidebar 
        user={user} 
        setUser={setUser}
        activeChat={activeChat} 
        setActiveChat={setActiveChat}
        onLogout={handleLogout}
        onlineUsers={onlineUsers}
        socket={socket}
      />
      {activeChat ? (
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <ChatWindow 
            user={user} 
            activeChat={activeChat} 
            socket={socket} 
            onlineUsers={onlineUsers}
            onToggleInfo={() => setShowRightSidebar(!showRightSidebar)}
            setMessages={setActiveChatMessages}
            messages={activeChatMessages}
          />
          {showRightSidebar && (
            <InfoSidebar 
              user={user}
              activeChat={activeChat}
              onClose={() => setShowRightSidebar(false)}
              messages={activeChatMessages}
              onUpdateChat={(updated) => setActiveChat(updated)}
              onUpdateUser={setUser}
            />
          )}
        </div>
      ) : (
        <div className="empty-chat">
          <h1>WhatsApp Web</h1>
          <p>Send and receive messages without keeping your phone online.</p>
          <p>Use WhatsApp on up to 4 linked devices and 1 phone at the same time.</p>
        </div>
      )}
    </div>
  );
};

export default ChatLayout;
