const Post = require('../models/Post');
const ExchangeRequest = require('../models/ExchangeRequest');

exports.createPost = async (req, res) => {
  try {
    const { content, skills } = req.body;
    const author = req.user.userId;

    const newPost = new Post({ author, content, skills });
    await newPost.save();

    res.status(201).json({ message: 'Post created', post: newPost });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create post', error: err.message });
  }
};

exports.getAllPosts = async (req, res) => {
  try {
    const currentUserId = req.user.userId;

    const posts = await Post.find()
      .populate('author', 'name email')
      .populate('comments.user', 'name')
      .sort({ createdAt: -1 });

    const requests = await ExchangeRequest.find({
      $or: [
        { fromUser: currentUserId },
        { toUser: currentUserId }
      ]
    });

   const result = posts.map(post => {
  const authorId = post.author._id.toString();
  let requestStatus = 'none';
  let canCancel = false;

  //  Get all requests between current user and post author
  const relatedRequests = requests.filter(r =>
    (r.fromUser.toString() === currentUserId && r.toUser.toString() === authorId) ||
    (r.toUser.toString() === currentUserId && r.fromUser.toString() === authorId)
  );

  if (relatedRequests.length > 0) {
    // Pick the most recent one by createdAt
    const latestRequest = relatedRequests.reduce((latest, current) =>
      new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
    );

    requestStatus = latestRequest.status;

    if (
      latestRequest.fromUser.toString() === currentUserId &&
      requestStatus === 'pending'
    ) {
      canCancel = true;
    }
  }

  return {
    ...post.toObject(),
    requestStatus,
    canCancel
  };
});


    res.status(200).json({ posts: result, currentUserId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load posts', error: err.message });
  }
};




exports.deletePost = async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user.userId;

     console.log('Delete Request: postId =', postId, 'by user =', userId);

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Only author can delete
    if (post.author.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized to delete this post' });
    }

    await Post.findByIdAndDelete(postId);
    res.status(200).json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Delete failed', error: err.message });
  }
};
// Toggle Like
exports.toggleLike = async (req, res) => {
  const userId = req.user.userId;
  const post = await Post.findById(req.params.postId);

  if (!post) return res.status(404).json({ message: 'Post not found' });

  const alreadyLiked = post.likes.includes(userId);
  if (alreadyLiked) {
    post.likes.pull(userId);
  } else {
    post.likes.push(userId);
  }

  await post.save();
  res.status(200).json({ message: alreadyLiked ? 'Unliked' : 'Liked', likes: post.likes.length });
};

// Add Comment
exports.addComment = async (req, res) => {
  const { text } = req.body;
  const userId = req.user.userId;

  const post = await Post.findById(req.params.postId);
  if (!post) return res.status(404).json({ message: 'Post not found' });

  post.comments.push({ user: userId, text });
  await post.save();

  res.status(201).json({ message: 'Comment added', comments: post.comments });
};
