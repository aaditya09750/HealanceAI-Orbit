import User from '../models/User.js';
import Notification from '../models/Notification.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.join(__dirname, '..');

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { name, avatar, profile } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (avatar) user.avatar = avatar;
    if (profile) {
      user.profile = { ...user.profile, ...profile };
    }

    const updatedUser = await user.save();
    res.json({ success: true, user: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload profile avatar
// @route   POST /api/users/profile/avatar
// @access  Private
export const uploadProfileAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image file' });
    }

    const user = await User.findById(req.user._id);
    const previousAvatar = user.avatar;
    // req.file.path is now a Cloudinary HTTPS URL (multer-storage-cloudinary).
    const avatarPath = req.file.path;
    user.avatar = avatarPath;

    const updatedUser = await user.save();

    // Backwards-compat: clean up legacy local-disk avatars if any user still has one.
    // Cloudinary-hosted avatars are not deleted here (would need cloudinary.uploader.destroy
    // with the public_id; deferred since avatars rarely churn).
    if (previousAvatar && previousAvatar.startsWith('/uploads/') && previousAvatar !== avatarPath) {
      const previousFileName = path.basename(previousAvatar);
      const previousFilePath = path.join(backendRoot, 'uploads', previousFileName);

      try {
        await fs.promises.unlink(previousFilePath);
      } catch (unlinkError) {
        if (unlinkError.code !== 'ENOENT') {
          console.warn(`Failed to delete old avatar: ${previousFilePath}`, unlinkError.message);
        }
      }
    }

    res.json({ success: true, user: updatedUser, avatar: avatarPath });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update password
// @route   PUT /api/users/password
// @access  Private
export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user notifications
// @route   GET /api/users/notifications
// @access  Private
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    const unreadCount = await Notification.countDocuments({
      user: req.user._id,
      isRead: false,
    });

    res.json({ success: true, notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/users/notifications/:id/read
// @access  Private
export const markNotificationRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/users/notifications/read-all
// @access  Private
export const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle blog bookmark
// @route   POST /api/users/bookmarks/:blogId
// @access  Private
export const toggleBookmark = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const blogId = req.params.blogId;

    const index = user.bookmarkedBlogs.indexOf(blogId);
    if (index > -1) {
      user.bookmarkedBlogs.splice(index, 1);
    } else {
      user.bookmarkedBlogs.push(blogId);
    }

    await user.save();
    res.json({
      success: true,
      bookmarked: index === -1,
      bookmarkedBlogs: user.bookmarkedBlogs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get bookmarked blogs
// @route   GET /api/users/bookmarks
// @access  Private
export const getBookmarks = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('bookmarkedBlogs');
    res.json({ success: true, bookmarks: user.bookmarkedBlogs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
