import Notification from '../models/Notification.js';

// @desc    Get all notifications for user
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res) => {
  try {
    const { unreadOnly } = req.query;
    const filter = { user: req.user._id };
    if (unreadOnly === 'true') filter.isRead = false;

    const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(50);

    const unreadCount = await Notification.countDocuments({
      user: req.user._id,
      isRead: false,
    });

    res.json({ success: true, notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a notification
// @route   POST /api/notifications
// @access  Private
export const createNotification = async (req, res) => {
  try {
    const { title, message, type, link, icon } = req.body;

    const notification = await Notification.create({
      user: req.user._id,
      title,
      message,
      type: type || 'system',
      link,
      icon,
    });

    res.status(201).json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Clear all notifications
// @route   DELETE /api/notifications/clear-all
// @access  Private
export const clearAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user._id });
    res.json({ success: true, message: 'All notifications cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a water reminder
// @route   POST /api/notifications/water-reminder
// @access  Private
export const createWaterReminder = async (req, res) => {
  try {
    const { intervalMinutes } = req.body;

    // Create immediate reminder notification
    const notification = await Notification.create({
      user: req.user._id,
      title: '💧 Water Reminder',
      message: `Time to drink water! Stay hydrated for better health.`,
      type: 'reminder',
      icon: 'water',
    });

    res.status(201).json({
      success: true,
      notification,
      message: `Water reminder set for every ${intervalMinutes} minutes`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create activity notification
// @route   POST /api/notifications/activity
// @access  Private
export const createActivityNotification = async (req, res) => {
  try {
    const { activityType, message } = req.body;

    const titles = {
      goal_completed: '🎯 Goal Completed!',
      goal_progress: '📈 Goal Progress',
      steps: '👣 Steps Update',
      water: '💧 Water Intake',
      calories: '🔥 Calories Update',
      sleep: '😴 Sleep Reminder',
      health: '❤️ Health Alert',
      achievement: '🏆 Achievement Unlocked!',
      medication: '💊 Medication Reminder',
      exercise: '🏃 Exercise Time',
    };

    const notification = await Notification.create({
      user: req.user._id,
      title: titles[activityType] || '📢 Notification',
      message,
      type: activityType === 'achievement' ? 'achievement' : 'health',
      icon: activityType,
    });

    res.status(201).json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper function to create system notifications (used internally)
export const createSystemNotification = async (userId, title, message, type = 'system') => {
  try {
    return await Notification.create({
      user: userId,
      title,
      message,
      type,
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
};
