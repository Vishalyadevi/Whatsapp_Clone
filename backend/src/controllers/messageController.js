const Message = require('../models/Message');
const User = require('../models/User');
const Group = require('../models/Group');

const getMessages = async (req, res) => {
  const { user1, user2 } = req.params; // user2 could be a user ID or a group ID
  const isGroup = req.query.isGroup === 'true';
  
  try {
    let query = {};
    if (isGroup) {
      query = { groupId: user2 };
    } else {
      query = {
        $or: [
          { senderId: user1, receiverId: user2 },
          { senderId: user2, receiverId: user1 }
        ]
      };
    }
    
    const messages = await Message.find(query).sort({ createdAt: 1 }).populate('senderId', 'username profilePic');
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching messages' });
  }
};

const sendMessage = async (req, res) => {
  const { receiverId, groupId, text, isForwarded } = req.body;
  const senderId = req.userId;
  
  try {
    if (receiverId) {
      const [sender, receiver] = await Promise.all([
        User.findById(senderId),
        User.findById(receiverId)
      ]);

      if (receiver && receiver.blockedUsers.includes(senderId)) {
        return res.status(403).json({ error: 'You are blocked by this user' });
      }

      if (sender && sender.blockedUsers.includes(receiverId)) {
        return res.status(403).json({ error: 'You have blocked this user' });
      }
    }

    let mediaUrl = '';
    let mediaType = '';
    
    if (req.file) {
      mediaUrl = `/uploads/${req.file.filename}`;
      if (req.file.mimetype.startsWith('image/')) mediaType = 'image';
      else if (req.file.mimetype.startsWith('video/')) mediaType = 'video';
      else if (req.file.mimetype.startsWith('audio/')) mediaType = 'audio';
      else mediaType = 'document';
    }

    if (!receiverId && !groupId && !text && !req.file) {
      return res.status(400).json({ error: 'Invalid request data' });
    }

    const newMessage = new Message({ 
      senderId, 
      receiverId: receiverId || null,
      groupId: groupId || null,
      text: text || '',
      mediaUrl,
      mediaType,
      isForwarded: isForwarded === 'true' || isForwarded === true
    });
    
    await newMessage.save();
    
    const populatedMessage = await Message.findById(newMessage._id).populate('senderId', 'username profilePic');

    const io = req.app.get('io');
    const userSockets = req.app.get('userSockets');
    
    if (io && userSockets) {
      if (groupId) {
        // Group message
        io.to(`group_${groupId}`).emit('newMessage', populatedMessage);
      } else {
        // Direct message
        const receiverSocketId = userSockets.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('newMessage', populatedMessage);
        }
        
        const senderSocketId = userSockets.get(senderId.toString());
        if (senderSocketId) {
          io.to(senderSocketId).emit('messageSent', populatedMessage);
        }
      }
    }

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ error: 'Server error sending message' });
  }
};

const editMessage = async (req, res) => {
  const { messageId } = req.params;
  const { text } = req.body;

  try {
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ error: 'Message not found' });
    if (message.senderId.toString() !== req.userId) return res.status(403).json({ error: 'Not authorized' });

    message.text = text;
    message.isEdited = true;
    await message.save();

    const populatedMessage = await Message.findById(messageId).populate('senderId', 'username profilePic');

    const io = req.app.get('io');
    if (io) {
      io.emit('messageEdited', populatedMessage);
    }

    res.status(200).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteMessage = async (req, res) => {
  const { messageId } = req.params;
  const { type } = req.query; // 'me' or 'everyone'

  try {
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ error: 'Message not found' });

    if (type === 'everyone') {
      if (message.senderId.toString() !== req.userId) return res.status(403).json({ error: 'Not authorized' });
      message.isDeletedForEveryone = true;
      message.text = 'This message was deleted';
      message.mediaUrl = '';
      message.mediaType = '';
    } else {
      if (!message.deletedFor.includes(req.userId)) {
        message.deletedFor.push(req.userId);
      }
    }
    
    await message.save();

    const populatedMessage = await Message.findById(messageId).populate('senderId', 'username profilePic');
    
    const io = req.app.get('io');
    if (io && type === 'everyone') {
      io.emit('messageDeleted', populatedMessage);
    }

    res.status(200).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const updateMessageStatus = async (req, res) => {
  const { messageId } = req.params;
  const { status } = req.body; // 'delivered', 'seen'

  try {
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ error: 'Message not found' });

    message.status = status;
    await message.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('messageStatusUpdated', message);
    }

    res.status(200).json(message);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getChatList = async (req, res) => {
  const userId = req.userId;
  try {
    const users = await User.find({ 
      _id: { $ne: userId },
      username: { $exists: true, $ne: '' }
    }).select('username profilePic status isOnline lastSeen');
    
    const chats = await Promise.all(users.map(async (otherUser) => {
      const lastMessage = await Message.findOne({
        $or: [
          { senderId: userId, receiverId: otherUser._id },
          { senderId: otherUser._id, receiverId: userId }
        ]
      }).sort({ createdAt: -1 }).populate('senderId', 'username');

      const unreadCount = await Message.countDocuments({
        senderId: otherUser._id,
        receiverId: userId,
        status: { $ne: 'seen' },
        isDeletedForEveryone: false
      });

      return {
        ...otherUser.toObject(),
        lastMessage: lastMessage ? {
          text: lastMessage.text,
          senderId: lastMessage.senderId,
          status: lastMessage.status,
          createdAt: lastMessage.createdAt,
          isMedia: !!lastMessage.mediaUrl,
          mediaType: lastMessage.mediaType
        } : null,
        unreadCount
      };
    }));

    // WhatsApp only shows active chats (those with messages) in the main list
    const activeChats = chats.filter(c => c.lastMessage !== null);

    // Sort by last message date
    activeChats.sort((a, b) => {
      const dateA = a.lastMessage ? new Date(a.lastMessage.createdAt) : new Date(0);
      const dateB = b.lastMessage ? new Date(b.lastMessage.createdAt) : new Date(0);
      return dateB - dateA;
    });

    console.log(`Returning ${activeChats.length} active chats for user ${userId}`);
    res.status(200).json(activeChats);
  } catch (error) {
    console.error('Error in getChatList:', error);
    res.status(500).json({ error: 'Server error fetching chat list' });
  }
};

const deleteChat = async (req, res) => {
  const userId = req.userId;
  const { targetId } = req.params;
  const isGroup = req.query.isGroup === 'true';

  try {
    if (isGroup) {
      // For groups, standard 'Delete chat' usually means clearing messages for the user
      // or if admin, deleting the group. Since we have deleteGroup, here we'll just clear messages.
      // However, Message model has 'deletedFor' array.
      await Message.updateMany(
        { groupId: targetId },
        { $addToSet: { deletedFor: userId } }
      );
    } else {
      // For direct chats, we can delete the messages or just add to deletedFor.
      // Usually, 'Delete chat' clears the history for the user.
      await Message.updateMany(
        {
          $or: [
            { senderId: userId, receiverId: targetId },
            { senderId: targetId, receiverId: userId }
          ]
        },
        { $addToSet: { deletedFor: userId } }
      );
    }
    res.status(200).json({ message: 'Chat deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error deleting chat' });
  }
};

module.exports = {
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  updateMessageStatus,
  getChatList,
  deleteChat
};
