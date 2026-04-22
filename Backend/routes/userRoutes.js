import express from 'express';
import {
  updateProfile,
  uploadProfileAvatar,
  updatePassword,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  toggleBookmark,
  getBookmarks,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(protect); // All routes are protected

router.put('/profile', updateProfile);
router.post('/profile/avatar', upload.single('avatar'), uploadProfileAvatar);
router.put('/password', updatePassword);
router.get('/notifications', getNotifications);
router.put('/notifications/read-all', markAllNotificationsRead);
router.put('/notifications/:id/read', markNotificationRead);
router.post('/bookmarks/:blogId', toggleBookmark);
router.get('/bookmarks', getBookmarks);

export default router;
