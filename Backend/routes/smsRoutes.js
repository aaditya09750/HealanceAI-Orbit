import express from 'express';
import {
  sendSmsMessage,
  sendTestSms,
  sendSmsLoginOtp,
  verifySmsLoginOtp,
} from '../controllers/smsController.js';

const router = express.Router();

router.post('/send', sendSmsMessage);
router.post('/test', sendTestSms);
router.post('/send-login-otp', sendSmsLoginOtp);
router.post('/verify-login-otp', verifySmsLoginOtp);

export default router;
