import express from 'express';
import {
  predictDiabetes,
  predictHeart,
  predictAll,
  predictSymptomsDisease,
  getSymptomsPredictionHistory,
  sharePredictionOnWhatsApp,
  shareSymptomsPredictionOnWhatsApp,
  getAdaptiveQuestions,
  warmupMl,
} from '../controllers/predictController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// Fire-and-forget ping that wakes the ML dyno so the user's actual prediction
// click does not eat the cold-start. Returns immediately.
router.get('/warmup', warmupMl);

router.post('/diabetes', predictDiabetes);
router.post('/heart', predictHeart);
router.post('/all', predictAll);
router.post('/adaptive-questions', getAdaptiveQuestions);
router.post('/symptoms-disease', predictSymptomsDisease);
router.get('/symptoms-history', getSymptomsPredictionHistory);
router.post('/share-whatsapp', sharePredictionOnWhatsApp);
router.post('/share-symptoms-whatsapp', shareSymptomsPredictionOnWhatsApp);

export default router;
