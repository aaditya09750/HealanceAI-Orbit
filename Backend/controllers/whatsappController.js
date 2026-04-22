import crypto from 'crypto';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import SignupOtp from '../models/SignupOtp.js';
import { sendTokenResponse } from '../utils/generateToken.js';
import {
  sendWhatsAppLoginOtp,
  normalizeWhatsAppNumber,
  isValidWhatsAppNumber,
} from '../utils/sendWhatsApp.js';

const OTP_EXPIRE_MS = 5 * 60 * 1000;

const hashOtp = (otp) => {
  return crypto.createHash('sha256').update(String(otp)).digest('hex');
};

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Send WhatsApp OTP for login
// @route   POST /api/whatsapp/send-login-otp
// @access  Public
export const sendLoginOtp = async (req, res) => {
  try {
    const { whatsappNumber } = req.body;

    if (!whatsappNumber) {
      return res.status(400).json({
        success: false,
        message: 'Please provide WhatsApp number',
      });
    }

    const normalizedNumber = normalizeWhatsAppNumber(whatsappNumber);
    if (!isValidWhatsAppNumber(normalizedNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid WhatsApp number in international format',
      });
    }

    const user = await User.findOne({ whatsappNumber: normalizedNumber });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this WhatsApp number. Please sign up first.',
      });
    }

    const otp = generateOtp();
    user.whatsappNumber = normalizedNumber;
    user.whatsappOtpHash = hashOtp(otp);
    user.whatsappOtpExpire = new Date(Date.now() + OTP_EXPIRE_MS);
    await user.save({ validateBeforeSave: false });

    const sendResult = await sendWhatsAppLoginOtp(normalizedNumber, otp);

    const responsePayload = {
      success: true,
      message: sendResult.sent
        ? 'OTP sent to your WhatsApp number'
        : 'OTP generated. Configure WhatsApp credentials to deliver messages automatically.',
    };

    if (process.env.NODE_ENV !== 'production' && !sendResult.sent) {
      responsePayload.devOtp = otp;
    }

    return res.json(responsePayload);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify WhatsApp OTP and login
// @route   POST /api/whatsapp/verify-login-otp
// @access  Public
export const verifyLoginOtp = async (req, res) => {
  try {
    const { whatsappNumber, otp } = req.body;

    if (!whatsappNumber || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide WhatsApp number and OTP',
      });
    }

    const normalizedNumber = normalizeWhatsAppNumber(whatsappNumber);
    const user = await User.findOne({ whatsappNumber: normalizedNumber });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid login request' });
    }

    if (!user.whatsappOtpHash || !user.whatsappOtpExpire || user.whatsappOtpExpire < new Date()) {
      return res
        .status(401)
        .json({ success: false, message: 'OTP expired. Please request a new OTP' });
    }

    const otpHash = hashOtp(otp);
    if (otpHash !== user.whatsappOtpHash) {
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

// @desc    Send WhatsApp OTP for signup
// @route   POST /api/whatsapp/send-signup-otp
// @access  Public
export const sendSignupOtp = async (req, res) => {
  try {
    const { name, email, password, whatsappNumber } = req.body;

    if (!name || !email || !password || !whatsappNumber) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, password and WhatsApp number',
      });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const normalizedNumber = normalizeWhatsAppNumber(whatsappNumber);
    if (!isValidWhatsAppNumber(normalizedNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid WhatsApp number in international format',
      });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res
        .status(400)
        .json({ success: false, message: 'User already exists with this email' });
    }

    const existingWhatsApp = await User.findOne({ whatsappNumber: normalizedNumber });
    if (existingWhatsApp) {
      return res
        .status(400)
        .json({ success: false, message: 'User already exists with this WhatsApp number' });
    }

    const otp = generateOtp();
    const otpHash = hashOtp(otp);

    await SignupOtp.findOneAndUpdate(
      { email: email.toLowerCase() },
      {
        name,
        email: email.toLowerCase(),
        password,
        whatsappNumber: normalizedNumber,
        otpHash,
        otpExpire: new Date(Date.now() + OTP_EXPIRE_MS),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const sendResult = await sendWhatsAppLoginOtp(normalizedNumber, otp);

    const responsePayload = {
      success: true,
      message: sendResult.sent
        ? 'Signup OTP sent to your WhatsApp number'
        : 'Signup OTP generated. Configure WhatsApp credentials to deliver messages automatically.',
    };

    if (process.env.NODE_ENV !== 'production' && !sendResult.sent) {
      responsePayload.devOtp = otp;
    }

    return res.json(responsePayload);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify WhatsApp OTP and complete signup
// @route   POST /api/whatsapp/verify-signup-otp
// @access  Public
export const verifySignupOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Please provide email and OTP' });
    }

    const signupAttempt = await SignupOtp.findOne({ email: email.toLowerCase() });
    if (!signupAttempt) {
      return res
        .status(400)
        .json({ success: false, message: 'Signup OTP not found. Please request a new OTP' });
    }

    if (signupAttempt.otpExpire < new Date()) {
      return res
        .status(401)
        .json({ success: false, message: 'OTP expired. Please request a new OTP' });
    }

    if (hashOtp(otp) !== signupAttempt.otpHash) {
      return res.status(401).json({ success: false, message: 'Invalid OTP' });
    }

    const existingEmail = await User.findOne({ email: signupAttempt.email });
    if (existingEmail) {
      await SignupOtp.deleteOne({ _id: signupAttempt._id });
      return res
        .status(400)
        .json({ success: false, message: 'User already exists with this email' });
    }

    const existingWhatsApp = await User.findOne({ whatsappNumber: signupAttempt.whatsappNumber });
    if (existingWhatsApp) {
      await SignupOtp.deleteOne({ _id: signupAttempt._id });
      return res
        .status(400)
        .json({ success: false, message: 'User already exists with this WhatsApp number' });
    }

    const user = await User.create({
      name: signupAttempt.name,
      email: signupAttempt.email,
      password: signupAttempt.password,
      whatsappNumber: signupAttempt.whatsappNumber,
    });

    await Notification.create({
      user: user._id,
      title: 'Welcome to Healance! 🎉',
      message: 'Start by setting up your health profile and exploring the dashboard.',
      type: 'system',
    });

    await SignupOtp.deleteOne({ _id: signupAttempt._id });

    return sendTokenResponse(user, 201, res);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
