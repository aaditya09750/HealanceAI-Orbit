import express from 'express';
import {
  sendMessage,
  getChatSessions,
  getSessionMessages,
  deleteSession,
  analyzeReport,
  explainMedicine,
  nearbyDoctors,
  geocodeCity,
} from '../controllers/chatbotController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/message', sendMessage);
router.get('/sessions', getChatSessions);
router.get('/sessions/:sessionId', getSessionMessages);
router.delete('/sessions/:sessionId', deleteSession);

// Report analysis — takes the reportId returned by /health-data/reports upload
router.post('/analyze-report/:reportId', analyzeReport);

// Medicine explanation — enriches a drug name with FDA label + RxNav class + interaction checks
router.post('/explain-medicine', explainMedicine);

// Nearby specialists — seeded DB (Mongo $geoNear) + OSM Overpass fallback
router.post('/nearby-doctors', nearbyDoctors);

// Geocode a city name to lat/lon (Open-Meteo free geocoding)
router.post('/geocode', geocodeCity);

export default router;
