import express from 'express';
import {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  createWaterReminder,
  createActivityNotification,
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/').get(getNotifications).post(createNotification);

router.put('/read-all', markAllAsRead);
router.delete('/clear-all', clearAllNotifications);

router.post('/water-reminder', createWaterReminder);
router.post('/activity', createActivityNotification);

router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

export default router;
