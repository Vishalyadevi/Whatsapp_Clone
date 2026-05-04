const express = require('express');
const { createGroup, getGroups, updateGroup, addMembers, removeMember, getGroupById, exitGroup, deleteGroup } = require('../controllers/groupController');
const auth = require('../middlewares/auth');

const router = express.Router();

router.post('/', auth, createGroup);
router.get('/', auth, getGroups);
router.get('/:groupId', auth, getGroupById);
router.put('/:groupId', auth, updateGroup);
router.post('/:groupId/members', auth, addMembers);
router.post('/:groupId/exit', auth, exitGroup);
router.delete('/:groupId', auth, deleteGroup);

module.exports = router;
