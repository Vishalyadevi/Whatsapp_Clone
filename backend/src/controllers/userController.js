const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
  const { email, username, password } = req.body;
  
  if (!email || !username || !password) {
    return res.status(400).json({ error: 'Please enter all fields' });
  }

  try {
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      email,
      username,
      password: hashedPassword
    });

    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    const { password: _, ...userWithoutPassword } = newUser.toObject();
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Please enter all fields' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    const { password: _, ...userWithoutPassword } = user.toObject();
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const logout = (req, res) => {
  res.cookie('token', '', { maxAge: 0 });
  res.status(200).json({ message: 'Logged out successfully' });
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getAllUsers = async (req, res) => {
  const currentUserId = req.userId; // use from middleware
  
  try {
    const query = {
      username: { $exists: true, $ne: '' }
    };
    if (currentUserId) {
      query._id = { $ne: currentUserId };
    }
    const users = await User.find(query).select('-password');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { username, status } = req.body;
    let updateData = {};
    if (username) updateData.username = username;
    if (status) updateData.status = status;
    if (req.file) updateData.profilePic = `/uploads/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(req.userId, updateData, { new: true }).select('-password');
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error updating profile' });
  }
};

const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(req.userId);
    if (!user.blockedUsers.includes(userId)) {
      user.blockedUsers.push(userId);
      await user.save();
    }
    res.status(200).json({ message: 'User blocked' });
  } catch (error) {
    res.status(500).json({ error: 'Server error blocking user' });
  }
};

const unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(req.userId);
    user.blockedUsers = user.blockedUsers.filter(id => id.toString() !== userId);
    await user.save();
    res.status(200).json({ message: 'User unblocked' });
  } catch (error) {
    res.status(500).json({ error: 'Server error unblocking user' });
  }
};

const reportUser = async (req, res) => {
  try {
    // For now, just a placeholder. In a real app, you'd save this to a 'Reports' collection.
    res.status(200).json({ message: 'Report submitted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  getAllUsers,
  updateProfile,
  blockUser,
  unblockUser,
  reportUser
};
