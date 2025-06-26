const mongoose = require('mongoose');

const exchangeRequestSchema = new mongoose.Schema({
  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  toUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: String,
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  scheduledDate: Date // optional, can be used after accepting
}, { timestamps: true });

module.exports = mongoose.model('ExchangeRequest', exchangeRequestSchema);
