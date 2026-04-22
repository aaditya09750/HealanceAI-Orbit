import { sendSms, normalizeSmsNumber, isValidSmsNumber } from '../utils/sendSms.js';
import crypto from 'crypto';
import User from '../models/User.js';
import { sendTokenResponse } from '../utils/generateToken.js';

const OTP_EXPIRE_MS = 5 * 60 * 1000;

const hashOtp = (otp) => {
  return crypto.createHash('sha256').update(String(otp)).digest('hex');
};

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Send SMS using Twilio
// @route   POST /api/sms/send
// @access  Public
export const sendSmsMessage = async (req, res) => {
  try {
    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both "to" and "message" fields.',
      });
    }

    const normalizedTo = normalizeSmsNumber(to);

    if (!isValidSmsNumber(normalizedTo)) {
      return res.status(400).json({
        success: false,
        message:
          'Please provide a valid phone number in international format (e.g. +9198XXXXXXXX).',
      });
    }

    const sms = await sendSms({ to: normalizedTo, body: message });

    return res.json({
      success: true,
      message: 'SMS sent successfully.',
      sms,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send test SMS to verify Twilio integration
// @route   POST /api/sms/test
// @access  Public
export const sendTestSms = async (req, res) => {
  try {
    const { to } = req.body;

    if (!to) {
      return res.status(400).json({ success: false, message: 'Please provide "to" phone number.' });
    }

    const normalizedTo = normalizeSmsNumber(to);

    if (!isValidSmsNumber(normalizedTo)) {
      return res.status(400).json({
        success: false,
        message:
          'Please provide a valid phone number in international format (e.g. +9198XXXXXXXX).',
      });
    }

    const sms = await sendSms({
      to: normalizedTo,
      body: 'Healance Twilio SMS test successful. Your SMS setup is working.',
    });

    return res.json({
      success: true,
      message: 'Test SMS sent successfully.',
      sms,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send SMS OTP for login
// @route   POST /api/sms/send-login-otp
// @access  Public
export const sendSmsLoginOtp = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'Please provide phone number.' });
    }

    const normalizedNumber = normalizeSmsNumber(phoneNumber);

    if (!isValidSmsNumber(normalizedNumber)) {
      return res.status(400).json({
        success: false,
        message:
          'Please provide a valid phone number in international format (e.g. +9198XXXXXXXX).',
      });
    }

    const user = await User.findOne({ whatsappNumber: normalizedNumber });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this phone number. Please sign up first.',
      });
    }

    const otp = generateOtp();
    user.whatsappOtpHash = hashOtp(otp);
    user.whatsappOtpExpire = new Date(Date.now() + OTP_EXPIRE_MS);
    await user.save({ validateBeforeSave: false });

    await sendSms({
      to: normalizedNumber,
      body: `Your Healance login OTP is ${otp}. It is valid for 5 minutes.`,
    });

    return res.json({ success: true, message: 'OTP sent on your SMS number.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify SMS OTP and login
// @route   POST /api/sms/verify-login-otp
// @access  Public
export const verifySmsLoginOtp = async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      return res
        .status(400)
        .json({ success: false, message: 'Please provide phone number and OTP.' });
    }

    const normalizedNumber = normalizeSmsNumber(phoneNumber);
    const user = await User.findOne({ whatsappNumber: normalizedNumber });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid login request' });
    }

    if (!user.whatsappOtpHash || !user.whatsappOtpExpire || user.whatsappOtpExpire < new Date()) {
      return res
        .status(401)
        .json({ success: false, message: 'OTP expired. Please request a new OTP' });
    }

    if (hashOtp(otp) !== user.whatsappOtpHash) {
      return res.status(401).json({ success: false, message: 'Invalid OTP' });
    }

    user.whatsappOtpHash = undefined;
    user.whatsappOtpExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return sendTokenResponse(user, 200, res);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
