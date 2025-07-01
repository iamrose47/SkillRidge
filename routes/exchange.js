const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/authenticate');
const {sendRequest,getMyRequests,acceptRequest,rejectRequest,cancelRequest} = require('../controllers/exchangeController');

router.post('/send', authenticate, sendRequest);
router.get('/requests', authenticate, getMyRequests);
// router.put('/update/:requestId', authenticate, updateRequestStatus);
// router.post('/accept', authenticate, acceptRequest);
// router.post('/ignore', authenticate, ignoreRequest);

// Accept a request
router.patch('/:requestId/accept', authenticate, acceptRequest);

// Reject (ignore) a request
router.patch('/:requestId/reject', authenticate, rejectRequest);

router.delete('/cancel/:toUserId', authenticate, cancelRequest);


module.exports = router;
