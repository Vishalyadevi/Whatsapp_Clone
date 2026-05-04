import React, { useState, useEffect } from 'react';
import { LogOut, Search, User as UserIcon, Users, CircleDashed, MessageSquarePlus, MoreVertical, Camera, Image, Mic, FileText } from 'lucide-react';
import { getChats } from '../../api/messageService';
import { getGroups } from '../../api/groupService';
import { getAllUsers } from '../../api/userService';
import { format, isToday, isYesterday } from 'date-fns';
import ProfileModal from './ProfileModal';
import CreateGroupModal from './CreateGroupModal';

const Sidebar = ({ user, setUser, activeChat, setActiveChat, onLogout, onlineUsers, socket }) => {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All'); // All, Unread, Favourites, Groups
  const [showProfile, setShowProfile] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [showMenu, setShowMenu] = useState(false);

  const fetchUsersAndGroups = async () => {
    try {
      const [chatsData, groupsData, allUsersData] = await Promise.all([
        getChats(),
        getGroups(),
        getAllUsers()
      ]);
      setUsers(chatsData);
      setGroups(groupsData);
      setAllUsers(allUsersData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchUsersAndGroups();
  }, [user._id]);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchUsersAndGroups();
    };

    socket.on('newMessage', handleUpdate);
    socket.on('messageSent', handleUpdate);
    socket.on('messageStatusUpdated', handleUpdate);
    socket.on('groupUpdated', handleUpdate);
    socket.on('memberRemoved', handleUpdate);
    socket.on('groupDeleted', handleUpdate);

    return () => {
      socket.off('newMessage', handleUpdate);
      socket.off('messageSent', handleUpdate);
      socket.off('messageStatusUpdated', handleUpdate);
      socket.off('groupUpdated', handleUpdate);
      socket.off('memberRemoved', handleUpdate);
      socket.off('groupDeleted', handleUpdate);
    };
  }, [socket]);

  const allChats = [...users, ...groups].sort((a, b) => {
    const dateA = a.lastMessage ? new Date(a.lastMessage.createdAt) : new Date(0);
    const dateB = b.lastMessage ? new Date(b.lastMessage.createdAt) : new Date(0);
    return dateB - dateA;
  });

  const displayList = showNewChat ? allUsers.filter(u => u.username && u.username.toLowerCase().includes(searchTerm.toLowerCase())) : allChats.filter(item => {
    const isGroup = !!item.name;
    const name = isGroup ? item.name : item.username;
    if (!name) return false;
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (filter === 'Unread') return (item.unreadCount || 0) > 0;
    if (filter === 'Groups') return isGroup;
    return true; // 'All'
  });

  const handleNewChatClick = (targetUser) => {
    setActiveChat({ ...targetUser, isGroup: false });
    setShowNewChat(false);
  };

  return (
    <div className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="user-info">
          <div className="user-avatar" title={user.username} onClick={() => setShowProfile(true)} style={{ cursor: 'pointer' }}>
            {user.profilePic ? (
              <img src={`http://localhost:5000${user.profilePic}`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <UserIcon size={24} />
            )}
          </div>
        </div>
        <div className="sidebar-header-icons" style={{ display: 'flex', gap: '22px', color: '#54656f', alignItems: 'center', position: 'relative' }}>
          <Users size={20} style={{ cursor: 'pointer' }} onClick={() => setShowNewGroup(true)} title="Communities" />
          <MessageSquarePlus size={20} style={{ cursor: 'pointer' }} onClick={() => setShowNewChat(true)} title="New Chat" />
          <MoreVertical size={20} style={{ cursor: 'pointer' }} onClick={() => setShowMenu(!showMenu)} title="Menu" />
          
          {showMenu && (
            <div style={{ position: 'absolute', top: '40px', right: '0', backgroundColor: 'white', borderRadius: '4px', boxShadow: '0 2px 5px rgba(11,20,26,.2)', padding: '10px 0', zIndex: 100, width: '160px' }}>
              <div 
                style={{ padding: '12px 24px', cursor: 'pointer', fontSize: '14.5px', color: '#111b21' }}
                onClick={() => { setShowMenu(false); setShowProfile(true); }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f6f6'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                Profile
              </div>
              <div 
                style={{ padding: '12px 24px', cursor: 'pointer', fontSize: '14.5px', color: '#111b21' }}
                onClick={onLogout}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f6f6'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                Log out
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Search */}
      <div className="sidebar-search" style={{ padding: '8px 12px', borderBottom: '1px solid #e9edef' }}>
        <div className="search-input-container" style={{ backgroundColor: '#f0f2f5', borderRadius: '8px', display: 'flex', alignItems: 'center', padding: '0 12px', height: '35px' }}>
          <Search size={18} color="#54656f" />
          <input 
            type="text" 
            placeholder="Search or start a new chat" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'transparent', width: '100%', padding: '8px 12px', outline: 'none', fontSize: '14.5px', color: '#111b21' }}
          />
        </div>
      </div>

      {/* Tabs - Hidden in New Chat view */}
      {!showNewChat && (
        <div style={{ display: 'flex', gap: '8px', padding: '10px 12px', borderBottom: '1px solid #e9edef' }}>
          {['All', 'Unread', 'Groups'].map(f => (
            <div 
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                backgroundColor: filter === f ? '#e7fce3' : '#f0f2f5',
                color: filter === f ? '#0f814d' : '#54656f',
                fontSize: '14.5px',
                cursor: 'pointer',
                fontWeight: filter === f ? 500 : 400
              }}
            >
              {f}
            </div>
          ))}
        </div>
      )}

      {/* New Chat Header */}
      {showNewChat && (
        <div style={{ height: '108px', backgroundColor: '#008069', color: 'white', display: 'flex', alignItems: 'flex-end', padding: '20px', gap: '30px' }}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" style={{ cursor: 'pointer' }} onClick={() => setShowNewChat(false)}>
            <path d="M12 4l1.4 1.4L7.8 11H20v2H7.8l5.6 5.6L12 20l-8-8 8-8z" />
          </svg>
          <span style={{ fontSize: '19px', fontWeight: 500 }}>New chat</span>
        </div>
      )}

      {/* Chat List */}
      <div className="chat-list">
        {displayList.map(item => {
          const isGroup = !!item.name;
          const displayName = isGroup ? item.name : item.username;
          const pic = isGroup ? item.groupPic : item.profilePic;
          const lastMsg = item.lastMessage;
          
          let displayMsg = '';
          if (lastMsg) {
            const prefix = isGroup ? (lastMsg.senderId?._id === user._id ? 'You: ' : `${lastMsg.senderId?.username}: `) : '';
            if (lastMsg.isMedia) {
              const icon = lastMsg.mediaType === 'image' ? <Image size={16} /> : lastMsg.mediaType === 'video' ? <Camera size={16} /> : lastMsg.mediaType === 'audio' ? <Mic size={16} /> : <FileText size={16} />;
              displayMsg = <span style={{ display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prefix}{icon} {lastMsg.mediaType.charAt(0).toUpperCase() + lastMsg.mediaType.slice(1)}</span>;
            } else {
              displayMsg = `${prefix}${lastMsg.text}`;
            }
          } else {
            displayMsg = isGroup ? (item.description || 'Group chat') : item.status;
          }

          const formatTime = (date) => {
            if (!date) return '';
            const d = new Date(date);
            if (isToday(d)) return format(d, 'h:mm a');
            if (isYesterday(d)) return 'Yesterday';
            return format(d, 'dd/MM/yyyy');
          };
          
          return (
          <div 
            key={item._id} 
            className={`chat-list-item ${activeChat?._id === item._id ? 'active' : ''}`}
            onClick={() => showNewChat ? handleNewChatClick(item) : setActiveChat({ ...item, isGroup })}
            style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f2f2f2', transition: 'background-color 0.2s' }}
          >
            <div className="user-avatar" style={{ width: '49px', height: '49px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, marginRight: '15px' }}>
              {pic ? (
                <img src={`http://localhost:5000${pic}`} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', backgroundColor: '#dfe5e7', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white' }}>
                  {isGroup ? <Users size={28} /> : <UserIcon size={28} />}
                </div>
              )}
            </div>
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '17px', color: '#111b21', fontWeight: item.unreadCount > 0 ? 500 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {displayName}
                </span>
                <span style={{ fontSize: '12px', color: item.unreadCount > 0 ? '#00a884' : '#667781', fontWeight: item.unreadCount > 0 ? 500 : 400 }}>
                  {lastMsg ? formatTime(lastMsg.createdAt) : ''}
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0, flex: 1 }}>
                  {!isGroup && lastMsg && lastMsg.senderId?._id === user._id && (
                    <svg viewBox="0 0 16 15" width="16" height="15" fill={lastMsg.status === 'seen' ? '#53bdeb' : '#8696a0'} style={{ flexShrink: 0 }}>
                      <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879 5.593 7.456a.364.364 0 0 0-.495.034L4.72 7.867a.365.365 0 0 0 .035.51l3.52 2.776a.365.365 0 0 0 .522-.051l5.311-7.273a.365.365 0 0 0-.097-.513z" />
                      {lastMsg.status !== 'sent' && (
                        <path d="M11.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L4.666 9.879 1.593 7.456a.364.364 0 0 0-.495.034L0.72 7.867a.365.365 0 0 0 .035.51l3.52 2.776a.365.365 0 0 0 .522-.051l5.311-7.273a.365.365 0 0 0-.097-.513z" />
                      )}
                    </svg>
                  )}
                  <span style={{ fontSize: '14px', color: '#667781', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                    {displayMsg}
                  </span>
                </div>
                
                {item.unreadCount > 0 && (
                  <div style={{ backgroundColor: '#25d366', color: 'white', borderRadius: '50%', minWidth: '20px', height: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '12px', fontWeight: 'bold', padding: '0 6px' }}>
                    {item.unreadCount}
                  </div>
                )}
              </div>
            </div>
          </div>
        )})}
      </div>
      
      {showProfile && <ProfileModal user={user} setUser={setUser} onClose={() => setShowProfile(false)} />}
      {showNewGroup && <CreateGroupModal onClose={() => setShowNewGroup(false)} onGroupCreated={fetchUsersAndGroups} />}
    </div>
  );
};

export default Sidebar;
