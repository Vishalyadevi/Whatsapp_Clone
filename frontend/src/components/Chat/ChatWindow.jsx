import React, { useState, useEffect, useRef } from 'react';
import { getMessages, sendMessage, editMessage, deleteMessage, updateMessageStatus } from '../../api/messageService';
import { Send, User as UserIcon, Smile, Plus, Mic, Video, Phone, Search, MoreVertical, Edit2, Trash2, CornerUpRight, Users, X, FileText, Download, File as FileIcon, Play, Pause, Image as ImageIcon, Camera, FileArchive } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import EmojiPicker from 'emoji-picker-react';
import CustomModal from '../Common/CustomModal';

const VoiceMessage = ({ url, isSent, senderPic }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const onLoadedMetadata = () => {
    if (audioRef.current.duration !== Infinity) {
      setDuration(audioRef.current.duration);
    }
  };

  const onTimeUpdate = () => {
    setCurrentTime(audioRef.current.currentTime);
  };

  const onEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 0', minWidth: '260px' }}>
      <audio 
        ref={audioRef} 
        src={url} 
        onLoadedMetadata={onLoadedMetadata} 
        onTimeUpdate={onTimeUpdate} 
        onEnded={onEnded}
        onDurationChange={onLoadedMetadata}
      />
      
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{ width: '45px', height: '45px', borderRadius: '50%', backgroundColor: '#dfe5e7', overflow: 'hidden' }}>
          {senderPic ? (
            <img src={`http://localhost:5000${senderPic}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="sender" />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8696a0' }}>
              <UserIcon size={24} />
            </div>
          )}
        </div>
        <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', backgroundColor: isSent ? '#d9fdd3' : 'white', borderRadius: '50%', padding: '2px' }}>
          <Mic size={14} color="#00a884" />
        </div>
      </div>

      <div onClick={togglePlay} style={{ cursor: 'pointer', color: '#54656f', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
        {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
        <div style={{ height: '4px', width: '100%', backgroundColor: '#d1d7db', borderRadius: '2px', position: 'relative', cursor: 'pointer' }} onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const pct = x / rect.width;
          audioRef.current.currentTime = pct * duration;
        }}>
          <div style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            height: '100%', 
            width: `${duration ? (currentTime / duration) * 100 : 0}%`, 
            backgroundColor: '#00a884', 
            borderRadius: '2px' 
          }}></div>
          <div style={{ 
            position: 'absolute', 
            top: '-5px', 
            left: `${duration ? (currentTime / duration) * 100 : 0}%`, 
            width: '14px', 
            height: '14px', 
            backgroundColor: '#00a884', 
            borderRadius: '50%', 
            transform: 'translateX(-50%)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
          }}></div>
        </div>
        <div style={{ fontSize: '12px', color: '#667781', display: 'flex', justifyContent: 'space-between' }}>
          <span>{formatTime(isPlaying ? currentTime : duration)}</span>
        </div>
      </div>
    </div>
  );
};

const ChatWindow = ({ user, activeChat, socket, onlineUsers, onToggleInfo, messages, setMessages }) => {
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherIsTyping, setOtherIsTyping] = useState(false);
  const [mediaFile, setMediaFile] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [messageSearchTerm, setMessageSearchTerm] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);
  const cancelRecordingRef = useRef(false);

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'OK',
    onConfirm: () => {}
  });

  const openModal = (config) => {
    setModalConfig({ ...config, isOpen: true });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeChat?.isGroup && socket) {
      socket.emit('joinGroup', activeChat._id);
    }
  }, [activeChat, socket]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const data = await getMessages(user._id, activeChat._id, activeChat.isGroup);
        setMessages(data);
        
        // Mark as seen
        data.forEach(msg => {
          if (msg.senderId._id !== user._id && msg.status !== 'seen' && !activeChat.isGroup) {
            updateMessageStatus(msg._id, 'seen');
          }
        });
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    if (activeChat) {
      fetchMessages();
      setEditingMessageId(null);
      setNewMessage('');
    }
  }, [user._id, activeChat]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      const isRelevant = activeChat.isGroup 
        ? message.groupId === activeChat._id
        : (message.senderId._id === activeChat._id && message.receiverId === user._id) || 
          (message.senderId._id === user._id && message.receiverId === activeChat._id);
          
      if (isRelevant) {
        setMessages((prev) => [...prev, message]);
        if (message.senderId._id !== user._id && !activeChat.isGroup) {
          updateMessageStatus(message._id, 'seen');
        }
      }
    };

    const handleMessageDeleted = (deletedMessage) => {
      setMessages(prev => prev.map(msg => msg._id === deletedMessage._id ? deletedMessage : msg));
    };

    const handleMessageEdited = (editedMessage) => {
      setMessages(prev => prev.map(msg => msg._id === editedMessage._id ? editedMessage : msg));
    };

    const handleMessageStatus = (updatedMessage) => {
      setMessages(prev => prev.map(msg => msg._id === updatedMessage._id ? updatedMessage : msg));
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('messageSent', handleNewMessage);
    socket.on('messageDeleted', handleMessageDeleted);
    socket.on('messageEdited', handleMessageEdited);
    socket.on('messageStatusUpdated', handleMessageStatus);
    
    socket.on('typing', (senderId) => {
      if (activeChat.isGroup || senderId === activeChat._id) setOtherIsTyping(true);
    });
    
    socket.on('stopTyping', (senderId) => {
      if (activeChat.isGroup || senderId === activeChat._id) setOtherIsTyping(false);
    });

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('messageSent', handleNewMessage);
      socket.off('messageDeleted', handleMessageDeleted);
      socket.off('messageEdited', handleMessageEdited);
      socket.off('messageStatusUpdated', handleMessageStatus);
      socket.off('typing');
      socket.off('stopTyping');
    };
  }, [socket, activeChat, user._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    setShowEmojiPicker(false);
    if ((!newMessage.trim() && !mediaFile) || !socket) return;

    if (editingMessageId) {
      try {
        await editMessage(editingMessageId, newMessage);
        setEditingMessageId(null);
        setNewMessage('');
      } catch (error) {
        console.error('Error editing message:', error);
      }
      return;
    }

    const messageData = {
      text: newMessage,
    };
    if (activeChat.isGroup) {
      messageData.groupId = activeChat._id;
    } else {
      messageData.receiverId = activeChat._id;
    }
    if (mediaFile) {
      messageData.media = mediaFile;
    }

    try {
      await sendMessage(messageData);
      setNewMessage('');
      setMediaFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      if (isTyping) {
        setIsTyping(false);
        socket.emit('stopTyping', { senderId: user._id, receiverId: activeChat._id, groupId: activeChat.isGroup ? activeChat._id : null });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    if (!socket || editingMessageId) return;
    
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', { senderId: user._id, receiverId: activeChat._id, groupId: activeChat.isGroup ? activeChat._id : null });
    }
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('stopTyping', { senderId: user._id, receiverId: activeChat._id, groupId: activeChat.isGroup ? activeChat._id : null });
    }, 2000);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size > 0 && !cancelRecordingRef.current) {
          const file = new File([audioBlob], 'voice-message.webm', { type: 'audio/webm' });
          const messageData = { media: file };
          if (activeChat.isGroup) messageData.groupId = activeChat._id;
          else messageData.receiverId = activeChat._id;
          await sendMessage(messageData);
        }
        stream.getTracks().forEach(track => track.stop());
      };

      cancelRecordingRef.current = false;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      let message = 'Could not access microphone. Please ensure it is not being used by another application.';
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        message = 'Microphone permission was denied or dismissed. Please allow microphone access to record voice messages.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        message = 'No microphone found. Please connect a microphone and try again.';
      }
      
      openModal({
        title: 'Microphone Error',
        message: message,
        confirmText: 'OK'
      });

      setIsRecording(false);
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    }
  };

  const stopRecording = (shouldSend = true) => {
    if (!mediaRecorderRef.current) return;
    cancelRecordingRef.current = !shouldSend;
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    clearInterval(recordingIntervalRef.current);
  };


  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAction = async (action, msg) => {
    setActiveMenuId(null);
    if (action === 'delete_me') {
      await deleteMessage(msg._id, 'me');
      setMessages(prev => prev.filter(m => m._id !== msg._id));
    } else if (action === 'delete_everyone') {
      await deleteMessage(msg._id, 'everyone');
    } else if (action === 'edit') {
      setEditingMessageId(msg._id);
      setNewMessage(msg.text);
    } else if (action === 'forward') {
      // For simplicity, just append forwarded tag and send to same chat
      const messageData = {
        text: msg.text,
        isForwarded: true
      };
      if (activeChat.isGroup) messageData.groupId = activeChat._id;
      else messageData.receiverId = activeChat._id;
      await sendMessage(messageData);
    }
  };

  return (
    <div className="chat-window" style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1, backgroundColor: '#efeae2', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundImage: 'url(https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png)', opacity: 0.06, zIndex: 0, pointerEvents: 'none' }}></div>
      
      {/* Header */}
      <div className="chat-header" style={{ height: '59px', padding: '10px 16px', backgroundColor: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1, borderLeft: '1px solid #d1d7db' }}>
        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={onToggleInfo}>
          <div className="user-avatar" style={{ width: '40px', height: '40px', overflow: 'hidden' }}>
            {activeChat.isGroup ? (
              activeChat.groupPic ? <img src={`http://localhost:5000${activeChat.groupPic}`} alt="Group" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Users size={24} />
            ) : (
              activeChat.profilePic ? <img src={`http://localhost:5000${activeChat.profilePic}`} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <UserIcon size={24} />
            )}
          </div>
          <div className="chat-header-info" style={{ marginLeft: '15px' }}>
            <span style={{ fontSize: '16px', fontWeight: 500, color: '#111b21' }}>
              {activeChat.isGroup ? activeChat.name : activeChat.username}
            </span>
            <span style={{ fontSize: '13px', color: '#667781', display: 'block' }}>
              {otherIsTyping ? (
                <span style={{color: '#00a884'}}>typing...</span>
              ) : !activeChat.isGroup && onlineUsers && onlineUsers.has(activeChat._id) ? (
                <span>Online</span>
              ) : !activeChat.isGroup && activeChat.lastSeen ? (
                <span>last seen {format(new Date(activeChat.lastSeen), 'hh:mm a')}</span>
              ) : (
                activeChat.isGroup ? 'Group chat' : activeChat.status
              )}
            </span>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '22px', color: '#54656f', paddingRight: '10px' }}>
          <Search size={20} style={{ cursor: 'pointer', color: showSearch ? '#00a884' : '#54656f' }} title="Search" onClick={() => { setShowSearch(!showSearch); setMessageSearchTerm(''); }} />
        </div>
      </div>

      {/* Search Bar Overlay */}
      {showSearch && (
        <div style={{ padding: '10px 16px', backgroundColor: '#ffffff', borderBottom: '1px solid #d1d7db', display: 'flex', alignItems: 'center', zIndex: 2 }}>
          <div style={{ flex: 1, backgroundColor: '#f0f2f5', borderRadius: '8px', padding: '6px 12px', display: 'flex', alignItems: 'center' }}>
            <Search size={16} color="#54656f" style={{ marginRight: '10px' }} />
            <input 
              type="text" 
              placeholder="Search messages..." 
              value={messageSearchTerm}
              onChange={(e) => setMessageSearchTerm(e.target.value)}
              style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '14.5px', color: '#111b21' }}
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="chat-messages" style={{ flex: 1, padding: '20px 60px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px', zIndex: 1 }} onClick={() => setActiveMenuId(null)}>
        {messages.filter(msg => {
          if (!showSearch || !messageSearchTerm) return true;
          return msg.text && msg.text.toLowerCase().includes(messageSearchTerm.toLowerCase());
        }).map((msg, index) => {
          if (msg.deletedFor?.includes(user._id)) return null;
          
          const isSent = msg.senderId._id === user._id;
          const msgDate = new Date(msg.createdAt);
          
          // Logic for date separator
          let showDateSeparator = false;
          let separatorText = '';
          
          if (index === 0) {
            showDateSeparator = true;
          } else {
            const prevMsg = messages[index - 1];
            const prevDate = new Date(prevMsg.createdAt);
            if (msgDate.toDateString() !== prevDate.toDateString()) {
              showDateSeparator = true;
            }
          }
          
          if (showDateSeparator) {
            if (isToday(msgDate)) separatorText = 'TODAY';
            else if (isYesterday(msgDate)) separatorText = 'YESTERDAY';
            else separatorText = format(msgDate, 'MMMM d, yyyy').toUpperCase();
          }
          
          return (
            <React.Fragment key={msg._id || index}>
              {showDateSeparator && (
                <div style={{ alignSelf: 'center', backgroundColor: '#fff', padding: '5px 12px', borderRadius: '7.5px', fontSize: '12.5px', color: '#54656f', marginBottom: '12px', marginTop: '12px', boxShadow: '0 1px 0.5px rgba(11,20,26,.13)', textTransform: 'uppercase' }}>
                  {separatorText}
                </div>
              )}
            <div key={msg._id || index} className={`message ${isSent ? 'sent' : 'received'}`} 
              onMouseEnter={() => setActiveMenuId(msg._id)}
              onMouseLeave={() => setActiveMenuId(null)}
              style={{ 
              maxWidth: '65%', padding: '6px 9px 8px 9px', borderRadius: '7.5px', position: 'relative', boxShadow: '0 1px 0.5px rgba(11,20,26,.13)', width: 'fit-content',
              backgroundColor: isSent ? '#d9fdd3' : '#ffffff', alignSelf: isSent ? 'flex-end' : 'flex-start', borderTopRightRadius: isSent ? 0 : '7.5px', borderTopLeftRadius: !isSent ? 0 : '7.5px', marginBottom: '4px',
              minWidth: '60px'
            }}>
              {msg.isForwarded && (
                <div style={{ fontSize: '12px', color: '#667781', marginBottom: '4px', display: 'flex', alignItems: 'center', fontStyle: 'italic' }}>
                  <CornerUpRight size={12} style={{ marginRight: '4px' }} /> Forwarded
                </div>
              )}
              {activeChat.isGroup && !isSent && (
                <div style={{ fontSize: '12px', color: '#00a884', fontWeight: 'bold', marginBottom: '4px' }}>
                  {msg.senderId.username}
                </div>
              )}
              {msg.mediaUrl && (
                <div style={{ marginBottom: '5px' }}>
                  {msg.mediaType === 'image' && <img src={`http://localhost:5000${msg.mediaUrl}`} alt="Media" style={{ maxWidth: '300px', borderRadius: '8px', cursor: 'pointer' }} onClick={() => window.open(`http://localhost:5000${msg.mediaUrl}`, '_blank')} />}
                  {msg.mediaType === 'video' && <video src={`http://localhost:5000${msg.mediaUrl}`} controls style={{ maxWidth: '300px', borderRadius: '8px' }} />}
                  {msg.mediaType === 'audio' && (
                    <VoiceMessage 
                      url={`http://localhost:5000${msg.mediaUrl}`} 
                      isSent={isSent} 
                      senderPic={msg.senderId.profilePic} 
                    />
                  )}
                  {msg.mediaType === 'document' && (
                    <div style={{ backgroundColor: isSent ? '#c9e9c3' : '#f0f2f5', borderRadius: '4px', padding: '10px', display: 'flex', alignItems: 'center', gap: '12px', minWidth: '220px', cursor: 'pointer' }} onClick={() => window.open(`http://localhost:5000${msg.mediaUrl}`, '_blank')}>
                      <div style={{ backgroundColor: '#f44336', padding: '8px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileText size={24} color="white" />
                      </div>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontSize: '14px', color: '#111b21', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {msg.mediaUrl.split('/').pop().split('-').slice(1).join('-')}
                        </div>
                        <div style={{ fontSize: '12px', color: '#667781', display: 'flex', gap: '8px' }}>
                          <span>{msg.mediaUrl.split('.').pop().toUpperCase()}</span>
                        </div>
                      </div>
                      <div style={{ color: '#8696a0' }}>
                        <Download size={20} />
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div style={{ position: 'relative', display: 'flow-root' }}>
                <span className="message-text" style={{ 
                  fontSize: '14.2px', 
                  lineHeight: '19px', 
                  color: msg.isDeletedForEveryone ? '#8696a0' : '#111b21', 
                  fontStyle: msg.isDeletedForEveryone ? 'italic' : 'normal', 
                  wordBreak: 'break-word',
                  display: 'inline'
                }}>
                  {msg.text}
                </span>
                <div style={{ 
                  fontSize: '11px', 
                  color: '#667781', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '3px', 
                  whiteSpace: 'nowrap',
                  float: 'right',
                  position: 'relative',
                  bottom: '-5px',
                  marginLeft: '12px',
                  marginTop: '4px'
                }}>
                  {msg.isEdited && <span style={{ fontSize: '10px' }}>Edited</span>}
                  {format(new Date(msg.createdAt), 'h:mm a')}
                  {isSent && !msg.isDeletedForEveryone && (
                    <svg viewBox="0 0 16 15" width="16" height="15" fill={msg.status === 'seen' ? '#53bdeb' : '#8696a0'}>
                      <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879 5.593 7.456a.364.364 0 0 0-.495.034L4.72 7.867a.365.365 0 0 0 .035.51l3.52 2.776a.365.365 0 0 0 .522-.051l5.311-7.273a.365.365 0 0 0-.097-.513z" />
                      {msg.status !== 'sent' && (
                        <path d="M11.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L4.666 9.879 1.593 7.456a.364.364 0 0 0-.495.034L0.72 7.867a.365.365 0 0 0 .035.51l3.52 2.776a.365.365 0 0 0 .522-.051l5.311-7.273a.365.365 0 0 0-.097-.513z" />
                      )}
                    </svg>
                  )}
                </div>
              </div>

              {/* Message Context Menu */}
              {activeMenuId === msg._id && !msg.isDeletedForEveryone && (
                <div style={{ position: 'absolute', top: 0, right: 0, backgroundColor: 'white', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', borderRadius: '4px', zIndex: 10, display: 'flex', flexDirection: 'column' }}>
                  <button onClick={() => handleAction('forward', msg)} style={{ padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}><CornerUpRight size={14} /> Forward</button>
                  {isSent && <button onClick={() => handleAction('edit', msg)} style={{ padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}><Edit2 size={14} /> Edit</button>}
                  <button onClick={() => handleAction('delete_me', msg)} style={{ padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}><Trash2 size={14} /> Delete for me</button>
                  {isSent && <button onClick={() => handleAction('delete_everyone', msg)} style={{ padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}><Trash2 size={14} /> Delete for everyone</button>}
                </div>
              )}
              </div>
            </React.Fragment>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {showEmojiPicker && (
        <div style={{ position: 'absolute', bottom: '70px', left: '20px', zIndex: 10 }}>
          <EmojiPicker onEmojiClick={(emojiData) => setNewMessage(prev => prev + emojiData.emoji)} />
        </div>
      )}

      {/* Input Form */}
      {!activeChat.isGroup && user.blockedUsers?.includes(activeChat._id) ? (
        <div style={{ 
          height: '62px', 
          backgroundColor: '#f0f2f5', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#54656f',
          fontSize: '14px',
          zIndex: 1
        }}>
          You blocked this contact.
        </div>
      ) : (
        <form className="chat-input-container" onSubmit={handleSendMessage} style={{ minHeight: '62px', padding: '5px 16px', backgroundColor: '#f0f2f5', display: 'flex', alignItems: 'center', gap: '16px', zIndex: 1 }}>
        <button type="button" className="send-button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} style={{ background: 'none', border: 'none', color: '#54656f', cursor: 'pointer', padding: '8px' }}>
          <Smile size={26} />
        </button>
        <button type="button" className="send-button" onClick={() => fileInputRef.current?.click()} style={{ background: 'none', border: 'none', color: '#54656f', cursor: 'pointer', padding: '8px', position: 'relative' }}>
          <Plus size={26} />
          {mediaFile && <div style={{ position: 'absolute', top: 5, right: 5, width: '10px', height: '10px', backgroundColor: '#00a884', borderRadius: '50%' }}></div>}
        </button>
        <input type="file" ref={fileInputRef} onChange={(e) => setMediaFile(e.target.files[0])} style={{ display: 'none' }} />
        
        <div style={{ flex: 1, backgroundColor: '#ffffff', borderRadius: '8px', padding: '9px 12px', display: 'flex', alignItems: 'center' }}>
          <input 
            type="text" 
            className="chat-input" 
            placeholder={editingMessageId ? "Edit message..." : "Type a message"} 
            value={newMessage}
            onChange={handleInputChange}
            onClick={() => setShowEmojiPicker(false)}
            style={{ width: '100%', border: 'none', outline: 'none', fontSize: '15px', color: '#111b21', backgroundColor: 'transparent' }}
          />
        </div>
        
        {newMessage.trim() || mediaFile ? (
          <button type="submit" className="send-button" style={{ background: 'none', border: 'none', color: '#54656f', cursor: 'pointer', padding: '8px' }}>
            <Send size={24} />
          </button>
        ) : (
          <button type="button" className="send-button" onClick={startRecording} style={{ background: 'none', border: 'none', color: '#54656f', cursor: 'pointer', padding: '8px' }}>
            <Mic size={24} />
          </button>
        )}
        </form>
      )}

      {/* Voice Recording Overlay */}
      {isRecording && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '62px', backgroundColor: '#f0f2f5', display: 'flex', alignItems: 'center', padding: '0 16px', zIndex: 110, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Trash2 size={24} color="#ef4444" style={{ cursor: 'pointer' }} onClick={() => stopRecording(false)} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '10px', height: '10px', backgroundColor: '#ef4444', borderRadius: '50%', animation: 'pulse 1s infinite' }}></div>
              <span style={{ fontSize: '15px', color: '#111b21', fontWeight: 500 }}>{formatDuration(recordingDuration)}</span>
            </div>
          </div>
          
          <div style={{ color: '#667781', fontSize: '15px' }}>Recording...</div>
          
          <button 
            onClick={() => stopRecording(true)}
            style={{ width: '45px', height: '45px', borderRadius: '50%', backgroundColor: '#00a884', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}
          >
            <Send size={24} color="white" />
          </button>

          <style>
            {`
              @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.3; }
                100% { opacity: 1; }
              }
            `}
          </style>
        </div>
      )}

      {/* Media Selection Preview Overlay */}
      {mediaFile && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: '#f0f2f5', zIndex: 100, display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: '60px', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <X size={24} style={{ cursor: 'pointer', color: '#54656f' }} onClick={() => setMediaFile(null)} />
          </div>
          
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', backgroundColor: '#e9edef', margin: '0 40px', borderRadius: '8px', position: 'relative' }}>
            {mediaFile.type.startsWith('image/') ? (
              <img src={URL.createObjectURL(mediaFile)} alt="Preview" style={{ maxWidth: '80%', maxHeight: '80%', objectFit: 'contain', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
            ) : mediaFile.type.startsWith('video/') ? (
              <video src={URL.createObjectURL(mediaFile)} controls style={{ maxWidth: '80%', maxHeight: '80%' }} />
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '120px', height: '150px', backgroundColor: 'white', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '20px', margin: '0 auto', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                  <FileText size={64} color="#f44336" />
                </div>
                <div style={{ fontSize: '18px', color: '#111b21', marginBottom: '8px' }}>No preview available</div>
                <div style={{ fontSize: '14px', color: '#667781' }}>{mediaFile.name}</div>
                <div style={{ fontSize: '14px', color: '#667781', marginTop: '4px' }}>{(mediaFile.size / 1024).toFixed(0)} kB - {mediaFile.name.split('.').pop().toUpperCase()}</div>
              </div>
            )}
          </div>

          <div style={{ padding: '20px 40px', backgroundColor: '#f0f2f5', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: 'white', borderRadius: '8px', padding: '10px 16px' }}>
              <input 
                type="text" 
                placeholder="Add a caption..." 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: '15px' }}
                autoFocus
              />
              <Smile size={24} color="#54656f" />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '4px', border: '2px solid #00a884', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white' }}>
                  {mediaFile.type.startsWith('image/') ? <img src={URL.createObjectURL(mediaFile)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <FileText size={24} color="#f44336" />}
                </div>
                <div style={{ width: '48px', height: '48px', borderRadius: '4px', border: '1px solid #d1d7db', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()}>
                  <Plus size={24} color="#54656f" />
                </div>
              </div>
              
              <button 
                onClick={handleSendMessage}
                style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#00a884', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}
              >
                <Send size={28} color="white" />
              </button>
            </div>
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

export default ChatWindow;
