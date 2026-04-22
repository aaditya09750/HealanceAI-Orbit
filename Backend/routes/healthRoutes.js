import express from 'express';
import {
  addHealthData,
  getTodayData,
  getWeeklyTrends,
  getMonthlySummary,
  updateTodayData,
  uploadReport,
  getReports,
  getDashboardStats,
} from '../controllers/healthController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', addHealthData);
router.get('/today', getTodayData);
router.put('/today', updateTodayData);
router.get('/weekly', getWeeklyTrends);
router.get('/monthly', getMonthlySummary);
router.get('/dashboard', getDashboardStats);
router.post('/reports', upload.single('report'), uploadReport);
router.get('/reports', getReports);

export default router;
