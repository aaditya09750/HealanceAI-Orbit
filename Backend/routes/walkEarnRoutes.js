import express from 'express';
import {
  logSteps,
  getSummary,
  getRewards,
  redeemReward,
  getRedemptions,
} from '../controllers/walkEarnController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/log-steps', logSteps);
router.get('/summary', getSummary);
router.get('/stats', getSummary);
router.get('/rewards', getRewards);
router.post('/redeem/:rewardId', redeemReward);
router.get('/redemptions', getRedemptions);

export default router;
