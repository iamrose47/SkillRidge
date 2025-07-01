// routes/chat.js
const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/authenticate');
const ChatController = require('../controllers/chatController');

router.post('/send', authenticate, ChatController.sendMessage);
router.get('/history/:friendId', authenticate, ChatController.getChatHistory);
router.get('/suggestions', authenticate, ChatController.getSuggestions);

module.exports = router;
