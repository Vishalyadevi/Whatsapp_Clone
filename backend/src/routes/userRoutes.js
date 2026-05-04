const express = require('express');
const { register, login, logout, getMe, getAllUsers, updateProfile, blockUser, unblockUser, reportUser } = require('../controllers/userController');
const auth = require('../middlewares/auth');
const upload = require('../middlewares/upload');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', auth, getMe);
router.get('/', auth, getAllUsers);
router.put('/profile', auth, upload.single('profilePic'), updateProfile);
router.post('/block/:userId', auth, blockUser);
router.post('/unblock/:userId', auth, unblockUser);
router.post('/report/:userId', auth, reportUser);

module.exports = router;
