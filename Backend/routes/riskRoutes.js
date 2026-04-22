import express from 'express';
import { analyzeRisk, getRiskHistory, getLatestRisk } from '../controllers/riskController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/analyze', analyzeRisk);
router.get('/history', getRiskHistory);
router.get('/latest', getLatestRisk);

export default router;
