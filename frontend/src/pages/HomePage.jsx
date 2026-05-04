import React from 'react';
import ChatLayout from '../components/Chat/ChatLayout';

const HomePage = ({ user, setUser }) => {
  return <ChatLayout user={user} setUser={setUser} />;
};

export default HomePage;
