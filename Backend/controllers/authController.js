import User from '../models/User.js';
import {
  generateAccessToken,
  sendTokenResponse,
  getAccessCookieOptions,
  getRefreshCookieOptions,
} from '../utils/generateToken.js';
import Notification from '../models/Notification.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import sendEmail from '../utils/sendEmail.js';
import { normalizeWhatsAppNumber, isValidWhatsAppNumber } from '../utils/sendWhatsApp.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { name, email, password, whatsappNumber } = req.body;
    const normalizedWhatsApp = whatsappNumber ? normalizeWhatsAppNumber(whatsappNumber) : '';

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: 'User already exists with this email' });
    }

    if (normalizedWhatsApp && !isValidWhatsAppNumber(normalizedWhatsApp)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid WhatsApp number in international format',
      });
    }

    if (normalizedWhatsApp) {
      const existingWhatsAppUser = await User.findOne({ whatsappNumber: normalizedWhatsApp });
      if (existingWhatsAppUser) {
        return res
          .status(400)
          .json({ success: false, message: 'User already exists with this WhatsApp number' });
      }
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      ...(normalizedWhatsApp ? { whatsappNumber: normalizedWhatsApp } : {}),
    });

    // Send welcome notification
    await Notification.create({
      user: user._id,
      title: 'Welcome to Healance! 🎉',
      message: 'Start by setting up your health profile and exploring the dashboard.',
      type: 'system',
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
export const logout = (req, res) => {
  const expired = { expires: new Date(0), maxAge: 0 };

  res.cookie('accessToken', '', {
    ...getAccessCookieOptions(),
    ...expired,
  });
  res.cookie('refreshToken', '', {
    ...getRefreshCookieOptions(),
    ...expired,
  });
  // Backward compatibility
  res.cookie('token', '', {
    ...getAccessCookieOptions(),
    ...expired,
  });

  res.json({ success: true, message: 'Logged out successfully' });
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public (requires refresh cookie)
export const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'No refresh token provided' });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    const accessToken = generateAccessToken(user._id);
    const accessCookieOptions = getAccessCookieOptions();

    res
      .cookie('accessToken', accessToken, accessCookieOptions)
      // Backward compatibility for existing middleware/client flows.
      .cookie('token', accessToken, accessCookieOptions)
      .json({ success: true });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Refresh token invalid or expired' });
  }
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Google/GitHub OAuth handler (simplified)
// @route   POST /api/auth/social
// @access  Public
export const socialLogin = async (req, res) => {
  try {
    const { email, name, avatar, provider, providerId } = req.body;

    let user = await User.findOne({ email });

    if (user) {
      // User exists, update provider info if needed
      if (!user.provider || user.provider === 'local') {
        user.provider = provider;
        user.providerId = providerId;
        if (avatar) user.avatar = avatar;
        await user.save();
      }
    } else {
      // Create new user without password (social login)
      user = await User.create({
        name,
        email,
        password: `${providerId}_${Date.now()}`, // Random password for social users
        avatar: avatar || undefined,
        provider,
        providerId,
      });

      await Notification.create({
        user: user._id,
        title: 'Welcome to Healance! 🎉',
        message: 'Start by setting up your health profile and exploring the dashboard.',
        type: 'system',
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide an email address' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      // For security, don't reveal if user exists or not
      return res.json({
        success: true,
        message: 'If an account exists with that email, a password reset link has been sent.',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash token and save to database
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    // Email content
    const html = `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0ea5e9, #14b8a6); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">🔒 Password Reset Request</h1>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 16px 16px;">
          <p>Hi <strong>${user.name}</strong>,</p>
          <p>You requested a password reset for your Healance account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: linear-gradient(135deg, #0ea5e9, #14b8a6); color: white; padding: 14px 32px; text-decoration: none; border-radius: 10px; display: inline-block; font-weight: 600;">Reset Password</a>
          </div>
          <p style="color: #94a3b8; font-size: 14px;">Or copy this link: <br/><a href="${resetUrl}" style="color: #0ea5e9;">${resetUrl}</a></p>
          <p style="color: #ef4444; font-size: 14px; margin-top: 20px;">⚠️ This link expires in 30 minutes.</p>
          <p style="color: #64748b; font-size: 13px; margin-top: 20px;">If you didn't request this, please ignore this email. Your password will remain unchanged.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">
            © ${new Date().getFullYear()} Healance AI. All rights reserved.
          </p>
        </div>
      </div>
    `;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Reset Request - Healance AI',
        html,
      });

      res.json({
        success: true,
        message: 'If an account exists with that email, a password reset link has been sent.',
      });
    } catch (emailError) {
      // If email fails, remove reset token
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      console.error('Email error:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Email could not be sent. Please try again later.',
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:resetToken
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const { resetToken } = req.params;

    if (!password) {
      return res.status(400).json({ success: false, message: 'Please provide a new password' });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // Hash the token from URL to compare with database
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Send notification
    await Notification.create({
      user: user._id,
      title: 'Password Changed',
      message: 'Your password has been successfully changed.',
      type: 'system',
    });

    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update password (when logged in)
// @route   PUT /api/auth/update-password
// @access  Private
export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current and new password',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters',
      });
    }

    const user = await User.findById(req.user._id).select('+password');

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
