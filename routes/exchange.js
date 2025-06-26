const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/authenticate');
const {
  sendRequest,
  getMyRequests,
  updateRequestStatus,
   
} = require('../controllers/exchangeController');

router.post('/send', authenticate, sendRequest);
router.get('/my-requests', authenticate, getMyRequests);
router.put('/update/:requestId', authenticate, updateRequestStatus);

module.exports = router;
