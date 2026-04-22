import express from 'express';
import { getHealthForecast, getWeeklyForecast } from '../controllers/forecastController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getHealthForecast);
router.get('/weekly', getWeeklyForecast);

export default router;
