

const Group = require('../models/Group');
const User = require('../models/User');



exports.createGroup = async (req, res) => {
  const { name, memberEmails = [] } = req.body;

  try {
    // Fetch users by email
    const users = await User.find({ email: { $in: memberEmails } });

    // Extract user IDs
    const memberIds = users.map(user => user._id.toString());

    // Get emails that were not found
    const foundEmails = users.map(user => user.email);
    const notFoundEmails = memberEmails.filter(email => !foundEmails.includes(email));

    // Add current user as admin and member
    const group = new Group({
      name,
      admin: req.user.userId,
      members: [req.user.userId, ...memberIds],
    });

    await group.save();

    res.status(201).json({
      type: 'success',
      message: `Group '${name}' created.`,
      groupId: group._id,
      notFoundEmails 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ type: 'error', message: 'Failed to create group' });
  }
};

// Add a user to group (admin only)
exports.addToGroup = async (req, res) => {
  const groupId = req.params.groupId; // Fix here
  const { email } = req.body; //  Get email from body

  try {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ type: 'error', message: 'Group not found' });

    if (group.admin.toString() !== req.user.userId) {
      return res.status(403).json({ type: 'error', message: 'Only admin can add members' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ type: 'error', message: 'User not found' });
    }

    if (!group.members.includes(user._id)) {
      group.members.push(user._id);
      await group.save();
    }

    res.json({
      type: 'success',
      message: `User ${user.name} added to group.`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ type: 'error', message: 'Internal server error' });
  }
};



// Remove a user from group (admin only)
exports.removeFromGroup = async (req, res) => {
  const groupId = req.params.groupId;
  const { email } = req.body;

  try {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ type: 'error', message: 'Group not found' });

    if (group.admin.toString() !== req.user.userId) {
      return res.status(403).json({ type: 'error', message: 'Only admin can remove members' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ type: 'error', message: 'User not found' });

    if (user._id.toString() === req.user.userId) {
      return res.status(400).json({ type: 'error', message: 'Admin cannot remove themselves' });
    }

    group.members = group.members.filter(id => id.toString() !== user._id.toString());
    await group.save();

    res.json({
      type: 'success',
      message: `User ${user.name} removed from group.`
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ type: 'error', message: 'Internal server error' });
  }
};

// Get groups current user belongs to
exports.getMyGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user.userId })
      .populate('admin', 'name email')
      .populate('members', 'name email');
    res.json({ groups });
  } catch (error) {
    console.error(error);
    res.status(500).json({ type: 'error', message: 'Failed to fetch groups' });
  }
};

// Get details of a group
exports.getGroupDetails = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate('admin', 'name email')
      .populate('members', 'name email');
    if (!group) return res.status(404).json({ type: 'error', message: 'Group not found' });

    res.json({ group });
  } catch (error) {
    console.error(error);
    res.status(500).json({ type: 'error', message: 'Failed to fetch group details' });
  }
};

// Delete a group (admin only)
exports.deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ type: 'error', message: 'Group not found' });

    if (group.admin.toString() !== req.user.userId) {
      return res.status(403).json({ type: 'error', message: 'Only admin can delete the group' });
    }

    await Group.findByIdAndDelete(req.params.groupId);
    res.json({ type: 'success', message: `Group '${group.name}' deleted.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ type: 'error', message: 'Failed to delete group' });
  }
};

// Leave group (non-admin only)
exports.leaveGroup = async (req, res) => {
  const groupId = req.params.groupId;
  const userId = req.user.userId;

  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ type: 'error', message: 'Group not found' });
    }

    // Admin cannot leave the group
    if (group.admin.toString() === userId) {
      return res.status(400).json({ type: 'error', message: 'Admin cannot leave the group. You must delete it.' });
    }

    // Check if user is part of the group
    const isMember = group.members.some(id => id.toString() === userId);
    if (!isMember) {
      return res.status(400).json({ type: 'error', message: 'You are not a member of this group' });
    }

    // Remove user from members array
    group.members = group.members.filter(id => id.toString() !== userId);
    await group.save();

    res.status(200).json({ type: 'success', message: 'You have left the group' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ type: 'error', message: 'Internal server error' });
  }
};
// Get members of a group
exports.getGroupMembers = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId).populate('members', 'name email');
    if (!group) return res.status(404).json({ type: 'error', message: 'Group not found' });

    res.json({ members: group.members });
  } catch (error) {
    console.error(error);
    res.status(500).json({ type: 'error', message: 'Failed to fetch members' });
  }
};
