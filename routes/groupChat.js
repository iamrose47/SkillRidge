// routes/groupChat.js
const express = require('express');
const router = express.Router();
const GroupMessage = require('../models/GroupMessage');
const authenticate = require('../middlewares/authenticate');
const Group = require('../models/Group');

//  Send group message
router.post('/send/:groupId', authenticate, async (req, res) => {
  const { groupId } = req.params;
  const { text } = req.body;

  const group = await Group.findById(groupId);
  if (!group || !group.members.includes(req.user.userId)) {
    return res.status(403).json({ message: 'Not a group member' });
  }

  const message = new GroupMessage({ group: groupId, sender: req.user.userId, text });
  await message.save();

  res.json({ message: 'Message sent' });
});

//  Get group messages
router.get('/history/:groupId', authenticate, async (req, res) => {
  const { groupId } = req.params;

  const group = await Group.findById(groupId);
  if (!group || !group.members.includes(req.user.userId)) {
    return res.status(403).json({ message: 'Not a group member' });
  }

  const messages = await GroupMessage.find({ group: groupId })
    .populate('sender', 'name')
    .sort({ timestamp: 1 });

  res.json({ messages });
});

module.exports = router;
