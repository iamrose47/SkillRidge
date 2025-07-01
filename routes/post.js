const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authenticate = require('../middlewares/authenticate');

router.post('/create', authenticate, postController.createPost);
router.get('/all', authenticate, postController.getAllPosts);
router.delete('/:postId', authenticate, postController.deletePost);
router.post('/:postId/like', authenticate, postController.toggleLike);
router.post('/:postId/comment', authenticate, postController.addComment);

module.exports = router;
