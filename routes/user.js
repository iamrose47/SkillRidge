const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/authenticate');
const { updateProfile, getMatches, getProfile} = require('../controllers/userController');

router.put('/update', authenticate, updateProfile);
router.get('/matches', authenticate, getMatches);
router.get('/profile', authenticate, getProfile); 

module.exports = router;
