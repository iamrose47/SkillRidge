const User = require('../models/User');

exports.updateProfile = async (req, res) => {
  try {
    const { bio, location, skillsToTeach, skillsToLearn } = req.body;
    const userId = req.user.userId;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { bio, location, skillsToTeach, skillsToLearn },
      { new: true }
    );

    res.status(200).json({ message: 'Profile updated', user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Profile update failed', error: error.message });
  }
};

exports.getMatches = async (req, res) => {
  try {
    const userId = req.user.userId;

    const currentUser = await User.findById(userId);
    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    const potentialMatches = await User.find({
      _id: { $ne: userId },
      skillsToTeach: { $in: currentUser.skillsToLearn }
    }).select('-password');

    res.status(200).json({ matches: potentialMatches });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching matches', error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching profile', error: err.message });
  }
};
