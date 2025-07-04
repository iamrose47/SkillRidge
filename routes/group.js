// routes/groupRoutes.js
const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const authenticate = require('../middlewares/authenticate');

router.post('/create', authenticate, groupController.createGroup);
router.post('/add/:groupId', authenticate, groupController.addToGroup);
router.post('/remove/:groupId', authenticate, groupController.removeFromGroup);
router.get('/my-groups', authenticate, groupController.getMyGroups);
router.get('/:groupId', authenticate, groupController.getGroupDetails);
router.delete('/delete/:groupId',authenticate,groupController.deleteGroup);
router.post('/leave/:groupId', authenticate, groupController.leaveGroup);
router.get('/members/:groupId', authenticate, groupController.getGroupMembers);

module.exports = router;
