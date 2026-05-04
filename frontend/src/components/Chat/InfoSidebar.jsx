import React, { useState, useEffect } from 'react';
import { X, User as UserIcon, Users, Search, ChevronRight, Star, Bell, Clock, Ban, ThumbsDown, Trash2, Camera, Plus, UserMinus, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { updateGroup, addMembers, removeMember, exitGroup, deleteGroup } from '../../api/groupService';
import { blockUser, unblockUser, reportUser, getAllUsers } from '../../api/userService';
import { deleteChat } from '../../api/messageService';
import CustomModal from '../Common/CustomModal';

const InfoSidebar = ({ user, activeChat, onClose, onUpdateChat, onUpdateUser, messages }) => {
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [groupName, setGroupName] = useState(activeChat.name || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  
  // Modal state
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    confirmColor: '',
    onConfirm: () => {}
  });

  const openModal = (config) => {
    setModalConfig({ ...config, isOpen: true });
  };

  useEffect(() => {
    if (showAddMembers) {
      const fetchUsers = async () => {
        try {
          const allUsers = await getAllUsers();
          const currentMemberIds = activeChat.members.map(m => m._id);
          const filtered = allUsers.filter(u => !currentMemberIds.includes(u._id));
          setAvailableUsers(filtered);
        } catch (error) {
          console.error('Error fetching users:', error);
        }
      };
      fetchUsers();
    }
  }, [showAddMembers, activeChat.members]);

  // Extract media from messages
  const mediaMessages = messages.filter(m => m.mediaUrl).slice(0, 6);

  const handleUpdateGroupName = async () => {
    try {
      const updated = await updateGroup(activeChat._id, { name: groupName });
      onUpdateChat(updated);
      setIsEditingName(false);
    } catch (error) {
      console.error('Error updating group name:', error);
    }
  };

  const handleRemoveMember = async (memberId) => {
    openModal({
      title: 'Remove member?',
      message: `Are you sure you want to remove this member from the group?`,
      confirmText: 'REMOVE',
      confirmColor: '#ea0038',
      onConfirm: async () => {
        try {
          await removeMember(activeChat._id, memberId);
          const updatedMembers = activeChat.members.filter(m => m._id !== memberId);
          onUpdateChat({ ...activeChat, members: updatedMembers });
        } catch (error) {
          console.error('Error removing member:', error);
        }
      }
    });
  };

  const handleAddMembers = async () => {
    try {
      if (selectedUsers.length === 0) return;
      const updated = await addMembers(activeChat._id, selectedUsers);
      onUpdateChat(updated);
      setShowAddMembers(false);
      setSelectedUsers([]);
    } catch (error) {
      console.error('Error adding members:', error);
    }
  };

  const handleExitGroup = async () => {
    openModal({
      title: 'Exit group?',
      message: `Exit "${activeChat.name}" group?`,
      confirmText: 'EXIT GROUP',
      confirmColor: '#ea0038',
      onConfirm: async () => {
        try {
          await exitGroup(activeChat._id);
          onClose();
          window.location.reload();
        } catch (error) {
          console.error('Error exiting group:', error);
        }
      }
    });
  };

  const handleDeleteGroup = async () => {
    openModal({
      title: 'Delete group?',
      message: `Are you sure you want to delete "${activeChat.name}" group and all its messages? This action cannot be undone.`,
      confirmText: 'DELETE GROUP',
      confirmColor: '#ea0038',
      onConfirm: async () => {
        try {
          await deleteGroup(activeChat._id);
          onClose();
          window.location.reload();
        } catch (error) {
          console.error('Error deleting group:', error);
        }
      }
    });
  };

  const handleDeleteChat = async () => {
    openModal({
      title: 'Delete chat?',
      message: `Are you sure you want to delete this chat?`,
      confirmText: 'DELETE CHAT',
      confirmColor: '#ea0038',
      onConfirm: async () => {
        try {
          await deleteChat(activeChat._id, activeChat.isGroup);
          onUpdateChat({ ...activeChat, lastMessage: null });
          window.location.reload();
        } catch (error) {
          console.error('Error deleting chat:', error);
        }
      }
    });
  };

  const handleBlockUser = async () => {
    openModal({
      title: `Block ${activeChat.username}?`,
      message: `Blocked contacts will no longer be able to call you or send you messages.`,
      confirmText: 'BLOCK',
      confirmColor: '#ea0038',
      onConfirm: async () => {
        try {
          const updatedUser = await blockUser(activeChat._id);
          onUpdateUser(updatedUser);
          openModal({
            title: 'User Blocked',
            message: `${activeChat.username} has been blocked.`,
            confirmText: 'OK',
            onConfirm: () => {}
          });
        } catch (error) {
          console.error('Error blocking user:', error);
        }
      }
    });
  };

  const handleUnblockUser = async () => {
    try {
      const updatedUser = await unblockUser(activeChat._id);
      onUpdateUser(updatedUser);
      openModal({
        title: 'User Unblocked',
        message: `${activeChat.username} has been unblocked.`,
        confirmText: 'OK',
        onConfirm: () => {}
      });
    } catch (error) {
      console.error('Error unblocking user:', error);
    }
  };

  const isBlocked = user.blockedUsers?.includes(activeChat._id);

  const handleReport = async () => {
    openModal({
      title: `Report ${activeChat.isGroup ? 'group' : activeChat.username}?`,
      message: `Are you sure you want to report this ${activeChat.isGroup ? 'group' : 'contact'}? The last few messages will be forwarded to WhatsApp.`,
      confirmText: 'REPORT',
      confirmColor: '#ea0038',
      onConfirm: async () => {
        try {
          await reportUser(activeChat._id);
          openModal({
            title: 'Report Submitted',
            message: 'Thank you for your report.',
            confirmText: 'OK',
            onConfirm: () => {}
          });
        } catch (error) {
          console.error('Error reporting:', error);
        }
      }
    });
  };

  return (
    <div style={{ width: '400px', backgroundColor: '#ffffff', borderLeft: '1px solid #d1d7db', display: 'flex', flexDirection: 'column', height: '100%', zIndex: 10 }}>
      {/* Header */}
      <div style={{ height: '59px', padding: '0 16px', display: 'flex', alignItems: 'center', gap: '20px', backgroundColor: '#f0f2f5' }}>
        <X size={24} style={{ cursor: 'pointer', color: '#54656f' }} onClick={onClose} />
        <span style={{ fontSize: '16px', color: '#111b21', fontWeight: 500 }}>
          {activeChat.isGroup ? 'Group info' : 'Contact info'}
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#f0f2f5' }}>
        {/* Profile Section */}
        <div style={{ backgroundColor: '#ffffff', padding: '28px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <div style={{ width: '200px', height: '200px', borderRadius: '50%', overflow: 'hidden', marginBottom: '16px', position: 'relative' }}>
            {activeChat.isGroup ? (
              activeChat.groupPic ? <img src={`http://localhost:5000${activeChat.groupPic}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', backgroundColor: '#dfe5e7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={80} color="#adb5bd" /></div>
            ) : (
              activeChat.profilePic ? <img src={`http://localhost:5000${activeChat.profilePic}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', backgroundColor: '#dfe5e7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><UserIcon size={80} color="#adb5bd" /></div>
            )}
          </div>
          
          <div style={{ textAlign: 'center', width: '100%', padding: '0 20px' }}>
            {activeChat.isGroup ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {isEditingName ? (
                  <input 
                    value={groupName} 
                    onChange={(e) => setGroupName(e.target.value)} 
                    onBlur={handleUpdateGroupName}
                    autoFocus
                    style={{ fontSize: '24px', textAlign: 'center', border: 'none', borderBottom: '2px solid #00a884', outline: 'none', width: '80%' }}
                  />
                ) : (
                  <h2 style={{ fontSize: '24px', color: '#111b21', margin: 0, fontWeight: 400 }}>{activeChat.name}</h2>
                )}
              </div>
            ) : (
              <h2 style={{ fontSize: '24px', color: '#111b21', margin: 0, fontWeight: 400 }}>{activeChat.username}</h2>
            )}
            <p style={{ fontSize: '16px', color: '#667781', marginTop: '4px' }}>
              {activeChat.isGroup ? `Group · ${activeChat.members?.length} members` : activeChat.status || 'Hey there! I am using WhatsApp.'}
            </p>
          </div>
        </div>

        {/* About / Description Section */}
        {!activeChat.isGroup && (
          <div style={{ backgroundColor: '#ffffff', padding: '14px 30px', marginBottom: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <span style={{ fontSize: '14px', color: '#667781' }}>About</span>
            <div style={{ fontSize: '16px', color: '#111b21', marginTop: '10px' }}>{activeChat.status || 'Hey there! I am using WhatsApp.'}</div>
          </div>
        )}

        {/* Media Section */}
        {mediaMessages.length > 0 && (
          <div style={{ backgroundColor: '#ffffff', padding: '14px 30px', marginBottom: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', cursor: 'pointer' }}>
              <span style={{ fontSize: '14px', color: '#667781' }}>Media, links and docs</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#667781', fontSize: '14px' }}>
                {mediaMessages.length} <ChevronRight size={16} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {mediaMessages.map((m, i) => (
                <div key={i} style={{ aspectRatio: '1/1', backgroundColor: '#f0f2f5', borderRadius: '4px', overflow: 'hidden' }}>
                  {m.mediaType === 'image' && <img src={`http://localhost:5000${m.mediaUrl}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  {m.mediaType === 'video' && <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Clock size={24} /></div>}
                  {m.mediaType === 'document' && <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={24} /></div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Group Members Section */}
        {activeChat.isGroup && (
          <div style={{ backgroundColor: '#ffffff', marginBottom: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <div style={{ padding: '14px 30px', borderBottom: '1px solid #f0f2f5' }}>
              <span style={{ fontSize: '14px', color: '#667781' }}>{activeChat.members?.length} members</span>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {/* Add Member button for Admin */}
              {activeChat.admin === user._id && (
                <div style={{ padding: '15px 30px', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' }} onClick={() => setShowAddMembers(true)}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#00a884', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Plus size={20} color="white" />
                  </div>
                  <span style={{ fontSize: '16px', color: '#111b21' }}>Add member</span>
                </div>
              )}
              
              {activeChat.members?.map((member) => (
                <div key={member._id} style={{ padding: '10px 30px', display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid #f5f6f6' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden' }}>
                    {member.profilePic ? <img src={`http://localhost:5000${member.profilePic}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', backgroundColor: '#dfe5e7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><UserIcon size={20} color="#adb5bd" /></div>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '16px', color: '#111b21' }}>{member.username} {member._id === user._id && '(You)'}</div>
                    <div style={{ fontSize: '13px', color: '#667781' }}>{member.status || 'Available'}</div>
                  </div>
                  {activeChat.admin === member._id && <span style={{ fontSize: '11px', color: '#00a884', border: '1px solid #00a884', borderRadius: '3px', padding: '1px 4px' }}>Group Admin</span>}
                  {activeChat.admin === user._id && member._id !== user._id && (
                    <UserMinus size={18} color="#ef4444" style={{ cursor: 'pointer' }} onClick={() => handleRemoveMember(member._id)} title="Remove member" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Section */}
        <div style={{ backgroundColor: '#ffffff', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <div 
            onClick={activeChat.isGroup ? handleExitGroup : (isBlocked ? handleUnblockUser : handleBlockUser)}
            style={{ padding: '20px 30px', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer', color: '#ea0038' }}
          >
            <Ban size={20} />
            <span style={{ fontSize: '16px' }}>{activeChat.isGroup ? 'Exit group' : (isBlocked ? `Unblock ${activeChat.username}` : `Block ${activeChat.username}`)}</span>
          </div>
          <div 
            onClick={handleReport}
            style={{ padding: '20px 30px', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer', color: '#ea0038' }}
          >
            <ThumbsDown size={20} />
            <span style={{ fontSize: '16px' }}>{activeChat.isGroup ? 'Report group' : `Report ${activeChat.username}`}</span>
          </div>
          <div 
            onClick={activeChat.isGroup && activeChat.admin === user._id ? handleDeleteGroup : handleDeleteChat}
            style={{ padding: '20px 30px', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer', color: '#ea0038' }}
          >
            <Trash2 size={20} />
            <span style={{ fontSize: '16px' }}>{activeChat.isGroup ? (activeChat.admin === user._id ? 'Delete group' : 'Clear group messages') : 'Delete chat'}</span>
          </div>
        </div>
      </div>

      {/* Add Members Modal Overlay */}
      {showAddMembers && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(255,255,255,0.9)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ width: '400px', backgroundColor: '#ffffff', boxShadow: '0 17px 50px 0 rgba(11,20,26,.19)', borderRadius: '3px', display: 'flex', flexDirection: 'column', maxHeight: '80vh' }}>
            <div style={{ height: '64px', backgroundColor: '#008069', color: 'white', display: 'flex', alignItems: 'center', padding: '0 24px', gap: '20px' }}>
              <X size={24} style={{ cursor: 'pointer' }} onClick={() => setShowAddMembers(false)} />
              <span style={{ fontSize: '19px', fontWeight: 500 }}>Add members</span>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 0' }}>
              {availableUsers.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#667781', padding: '20px' }}>No users available to add</div>
              ) : (
                availableUsers.map(u => (
                  <div 
                    key={u._id} 
                    onClick={() => {
                      if (selectedUsers.includes(u._id)) setSelectedUsers(prev => prev.filter(id => id !== u._id));
                      else setSelectedUsers(prev => [...prev, u._id]);
                    }}
                    style={{ padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer', backgroundColor: selectedUsers.includes(u._id) ? '#f0f2f5' : 'transparent' }}
                  >
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden' }}>
                      {u.profilePic ? <img src={`http://localhost:5000${u.profilePic}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', backgroundColor: '#dfe5e7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><UserIcon size={20} color="#adb5bd" /></div>}
                    </div>
                    <span style={{ flex: 1 }}>{u.username}</span>
                    <input type="checkbox" checked={selectedUsers.includes(u._id)} readOnly />
                  </div>
                ))
              )}
            </div>
            
            {selectedUsers.length > 0 && (
              <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', backgroundColor: '#f0f2f5' }}>
                <button 
                  onClick={handleAddMembers}
                  style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#00a884', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}
                >
                  <ChevronRight size={30} color="white" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      <CustomModal 
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        confirmColor={modalConfig.confirmColor}
      />
    </div>
  );
};

export default InfoSidebar;
