const Group = require('../models/Group');
const Message = require('../models/Message');

const createGroup = async (req, res) => {
  try {
    const { name, members } = req.body;
    const admin = req.userId;

    // ensure admin is in the members list
    const memberSet = new Set(members);
    memberSet.add(admin);

    const group = new Group({
      name,
      members: Array.from(memberSet),
      admin
    });

    await group.save();
    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ error: 'Server error creating group' });
  }
};

const getGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.userId }).populate('members', 'username profilePic isOnline lastSeen');
    
    const enrichedGroups = await Promise.all(groups.map(async (group) => {
      const lastMessage = await Message.findOne({ groupId: group._id })
        .sort({ createdAt: -1 })
        .populate('senderId', 'username');
      
      const unreadCount = await Message.countDocuments({
        groupId: group._id,
        status: { $ne: 'seen' },
        senderId: { $ne: req.userId },
        isDeletedForEveryone: false
        // Note: For groups, "seen" status is complex. 
        // For simplicity, we'll just check if there are messages NOT from the user.
      });

      return {
        ...group.toObject(),
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

    res.status(200).json(enrichedGroups);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching groups' });
  }
};

const getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId).populate('members', 'username profilePic status isOnline lastSeen');
    if (!group) return res.status(404).json({ error: 'Group not found' });
    res.status(200).json(group);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const updateGroup = async (req, res) => {
  try {
    const { name } = req.body;
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (group.admin.toString() !== req.userId) return res.status(403).json({ error: 'Only admin can update group' });

    if (name) group.name = name;
    if (req.file) group.groupPic = `/uploads/${req.file.filename}`;

    await group.save();
    
    const io = req.app.get('io');
    if (io) {
      io.to(`group_${group._id}`).emit('groupUpdated', group);
    }

    res.status(200).json(group);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const addMembers = async (req, res) => {
  try {
    const { members } = req.body;
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (group.admin.toString() !== req.userId) return res.status(403).json({ error: 'Only admin can add members' });

    members.forEach(mId => {
      if (!group.members.includes(mId)) group.members.push(mId);
    });

    await group.save();
    const populated = await Group.findById(group._id).populate('members', 'username profilePic status isOnline lastSeen');
    
    const io = req.app.get('io');
    if (io) {
      io.to(`group_${group._id}`).emit('groupUpdated', populated);
    }
    
    res.status(200).json(populated);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const removeMember = async (req, res) => {
  try {
    const { userId } = req.params;
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (group.admin.toString() !== req.userId) return res.status(403).json({ error: 'Only admin can remove members' });
    if (userId === group.admin.toString()) return res.status(400).json({ error: 'Cannot remove admin' });

    group.members = group.members.filter(m => m.toString() !== userId);
    await group.save();
    
    const io = req.app.get('io');
    if (io) {
      io.to(`group_${group._id}`).emit('memberRemoved', { groupId: group._id, userId });
    }

    res.status(200).json({ message: 'Member removed' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const exitGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    
    if (group.admin.toString() === req.userId) {
      // If admin leaves, we should ideally assign a new admin or prevent leaving if only member
      if (group.members.length > 1) {
        group.members = group.members.filter(m => m.toString() !== req.userId);
        group.admin = group.members[0]; // Assign next member as admin
      } else {
        // Only member is admin, just delete group? or prevent?
        // Let's delete group if last member leaves
        await Group.findByIdAndDelete(req.params.groupId);
        return res.status(200).json({ message: 'Group deleted as last member left' });
      }
    } else {
      group.members = group.members.filter(m => m.toString() !== req.userId);
    }
    
    await group.save();
    res.status(200).json({ message: 'Left group successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error exiting group' });
  }
};

const deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (group.admin.toString() !== req.userId) return res.status(403).json({ error: 'Only admin can delete group' });

    await Group.findByIdAndDelete(req.params.groupId);
    // Also delete all messages in this group
    await Message.deleteMany({ groupId: req.params.groupId });
    
    res.status(200).json({ message: 'Group and messages deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error deleting group' });
  }
};

module.exports = {
  createGroup,
  getGroups,
  getGroupById,
  updateGroup,
  addMembers,
  removeMember,
  exitGroup,
  deleteGroup
};
