// controllers/chatController.js
const Message = require('../models/Message');

exports.sendMessage = async (req, res) => {
  const { text, receiver } = req.body;
  try {
    const message = new Message({
      sender: req.user.userId,
      receiver,
      text
    });
    await message.save();
    res.status(200).json({ message }); //  Correct response
  } catch (err) {
    res.status(500).json({ message: 'Failed to send message', error: err.message });
  }
};

exports.getChatHistory = async (req, res) => {
  const userId = req.user.userId;
  const friendId = req.params.friendId;
  try {
    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: friendId },
        { sender: friendId, receiver: userId }
      ]
    }).sort({ timestamp: 1 }).populate('sender', 'name');
    res.status(200).json({ messages });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load chat', error: err.message });
  }
};


exports.getSuggestions = async (req, res) => {
  const userId = req.user.userId;

  const globalMessages = await Message.find({}, 'text');
  const currentChatMessages = await Message.find({
    $or: [{ sender: userId }, { receiver: userId }]
  }, 'text');

  const extractWords = messages => {
    return messages
      .map(m => m.text)
      .flatMap(t => t.split(/\s+/))
      .map(w => w.toLowerCase().replace(/[^\w]/g, ''))
      .filter(w => w.length > 2);
  };

  const globalWords = extractWords(globalMessages);
  const currentWords = extractWords(currentChatMessages);

  res.json({
    global: [...new Set(globalWords)],
    current: [...new Set(currentWords)]
  });
};
