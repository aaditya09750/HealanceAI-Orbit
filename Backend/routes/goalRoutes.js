import express from 'express';
import {
  createGoal,
  getGoals,
  updateGoal,
  logProgress,
  deleteGoal,
  getAISuggestions,
} from '../controllers/goalController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/suggestions', getAISuggestions);
router.route('/').get(getGoals).post(createGoal);
router.route('/:id').put(updateGoal).delete(deleteGoal);
router.post('/:id/progress', logProgress);

export default router;
