const express = require('express');
const { getMessages, sendMessage, editMessage, deleteMessage, updateMessageStatus, getChatList, deleteChat } = require('../controllers/messageController');
const auth = require('../middlewares/auth');
const upload = require('../middlewares/upload');

const router = express.Router();

router.get('/:user1/:user2', auth, getMessages);
router.get('/chats', auth, getChatList);
router.post('/', auth, upload.single('media'), sendMessage);
router.put('/:messageId', auth, editMessage);
router.delete('/:messageId', auth, deleteMessage);
router.put('/:messageId/status', auth, updateMessageStatus);
router.delete('/chat/:targetId', auth, deleteChat);

module.exports = router;
