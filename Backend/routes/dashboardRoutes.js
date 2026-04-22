import express from 'express';
import { getSummary, getTrends, getInsights } from '../controllers/dashboardController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/summary', getSummary);
router.get('/trends', getTrends);
router.get('/insights', getInsights);

export default router;
