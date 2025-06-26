const ExchangeRequest = require('../models/ExchangeRequest');

exports.sendRequest = async (req, res) => {
  try {
    const { toUser, message } = req.body;
    const fromUser = req.user.userId;

    const existing = await ExchangeRequest.findOne({ fromUser, toUser, status: 'pending' });
    if (existing) return res.status(400).json({ message: 'Request already sent' });

    const request = new ExchangeRequest({ fromUser, toUser, message });
    await request.save();

    res.status(201).json({ message: 'Request sent', request });
  } catch (error) {
    res.status(500).json({ message: 'Error sending request', error: error.message });
  }
};

exports.getMyRequests = async (req, res) => {
  try {
    const userId = req.user.userId;

    const outgoing = await ExchangeRequest.find({ fromUser: userId }).populate('toUser', 'name email');
    const incoming = await ExchangeRequest.find({ toUser: userId }).populate('fromUser', 'name email');

    res.status(200).json({ incoming, outgoing });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch requests', error: error.message });
  }
};

exports.updateRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body; // "accepted" or "rejected"
    const userId = req.user.userId;

    const request = await ExchangeRequest.findById(requestId);
    if (!request || request.toUser.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this request' });
    }

    request.status = status;
    await request.save();

    res.status(200).json({ message: 'Request updated', request });
  } catch (error) {
    res.status(500).json({ message: 'Update failed', error: error.message });
  }
};


