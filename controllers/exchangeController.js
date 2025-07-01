const ExchangeRequest = require('../models/ExchangeRequest');
const User = require('../models/User');


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

const updateStatus = async (req, res, status) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.userId;

    const request = await ExchangeRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (request.toUser.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this request' });
    }

    request.status = status;
    await request.save();

    res.status(200).json({ message: `Request ${status}`, request });
  } catch (error) {
    res.status(500).json({ message: 'Update failed', error: error.message });
  }
};

// Accept a request
exports.acceptRequest = async (req, res) => {
  return updateStatus(req, res, 'accepted');
};

// Reject (ignore) a request
exports.rejectRequest = async (req, res) => {
  return updateStatus(req, res, 'rejected');
};


// GET /exchange/friends
exports.getFriends = async (req, res) => {
  try {
    const userId = req.user.userId;

    const acceptedRequests = await ExchangeRequest.find({
      status: 'accepted',
      $or: [
        { fromUser: userId },
        { toUser: userId }
      ]
    }).populate('fromUser toUser', 'name email');

    const friends = acceptedRequests.map(req => {
      const friend = req.fromUser._id.toString() === userId ? req.toUser : req.fromUser;
      return friend;
    });

    res.status(200).json({ friends });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load friends', error: err.message });
  }
};


exports.cancelRequest = async (req, res) => {
  const fromUser = req.user.userId; 
  const toUser = req.params.toUserId;

  try {
    const existingRequest = await ExchangeRequest.findOneAndDelete({
      fromUser,
      toUser,
      status: 'pending'
    });

    if (!existingRequest) {
      return res.status(404).json({ message: 'No pending request found to cancel' });
    }

    res.json({ message: 'Request canceled successfully' });
  } catch (err) {
    console.error('Cancel request error:', err);
    res.status(500).json({ message: 'Server error while canceling request' });
  }
};
