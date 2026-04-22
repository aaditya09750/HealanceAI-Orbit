import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Mail,
  Lock,
  User,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  MessageCircle,
  Smartphone,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../shared/ui/Button';

const AuthModal = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    login,
    register,
    forgotPassword,
    sendWhatsAppOtp,
    loginWithWhatsAppOtp,
    sendSmsOtp,
    loginWithSmsOtp,
    sendSignupWhatsAppOtp,
    completeSignupWithOtp,
    error,
    clearError,
  } = useAuth();
  const [mode, setMode] = useState('login'); // 'login', 'signup', 'forgot'
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    whatsappNumber: '',
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [showWhatsAppLogin, setShowWhatsAppLogin] = useState(false);
  const [showSmsLogin, setShowSmsLogin] = useState(false);
  const [otpRequested, setOtpRequested] = useState(false);
  const [smsOtpRequested, setSmsOtpRequested] = useState(false);
  const [useSignupWithOtp, setUseSignupWithOtp] = useState(false);
  const [signupOtpRequested, setSignupOtpRequested] = useState(false);
  const [signupOtp, setSignupOtp] = useState('');
  const [whatsAppLoginData, setWhatsAppLoginData] = useState({
    whatsappNumber: '',
    otp: '',
  });
  const [smsLoginData, setSmsLoginData] = useState({
    phoneNumber: '',
    otp: '',
  });

  const normalizeForInput = (value) => {
    const sanitized = String(value || '').replace(/[^\d+]/g, '');

    if (sanitized.startsWith('+')) {
      const plusNormalized = `+${sanitized.slice(1).replace(/\D/g, '')}`;
      if (plusNormalized.startsWith('+91') && plusNormalized.length <= 13) return plusNormalized;
      return plusNormalized.slice(0, 16);
    }

    const digits = sanitized.replace(/\D/g, '');
    if (digits.length === 0) return '';
    if (digits.length <= 10) return `+91${digits}`;
    if (digits.startsWith('91')) return `+${digits.slice(0, 12)}`;
    return `+${digits.slice(0, 15)}`;
  };

  // Clear form and errors when modal opens/closes or mode changes
  useEffect(() => {
    if (!isAuthModalOpen) {
      setFormData({ name: '', email: '', password: '', confirmPassword: '', whatsappNumber: '' });
      setValidationErrors({});
      setSuccessMessage('');
      setShowWhatsAppLogin(false);
      setShowSmsLogin(false);
      setOtpRequested(false);
      setSmsOtpRequested(false);
      setUseSignupWithOtp(false);
      setSignupOtpRequested(false);
      setSignupOtp('');
      setWhatsAppLoginData({ whatsappNumber: '', otp: '' });
      setSmsLoginData({ phoneNumber: '', otp: '' });
      setMode('login');
      clearError();
    }
  }, [isAuthModalOpen]);

  useEffect(() => {
    setFormData({ name: '', email: '', password: '', confirmPassword: '', whatsappNumber: '' });
    setValidationErrors({});
    setSuccessMessage('');
    setShowWhatsAppLogin(false);
    setShowSmsLogin(false);
    setOtpRequested(false);
    setSmsOtpRequested(false);
    setUseSignupWithOtp(false);
    setSignupOtpRequested(false);
    setSignupOtp('');
    setWhatsAppLoginData({ whatsappNumber: '', otp: '' });
    setSmsLoginData({ phoneNumber: '', otp: '' });
    clearError();
  }, [mode]);

  if (!isAuthModalOpen) return null;

  const validateForm = () => {
    const errors = {};

    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }

    if (mode !== 'forgot') {
      // Password validation
      if (!formData.password) {
        errors.password = 'Password is required';
      } else if (formData.password && formData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }

      // Name validation for signup
      if (mode === 'signup') {
        if (!formData.name) {
          errors.name = 'Name is required';
        } else if (formData.name.length < 2) {
          errors.name = 'Name must be at least 2 characters';
        }

        // Confirm password validation
        if (!formData.confirmPassword) {
          errors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
          errors.confirmPassword = 'Passwords do not match';
        }

        if (!formData.whatsappNumber) {
          if (useSignupWithOtp) {
            errors.whatsappNumber = 'WhatsApp number is required';
          }
        } else if (!/^\+[1-9]\d{7,14}$/.test(formData.whatsappNumber)) {
          errors.whatsappNumber = 'Use format like +9198XXXXXXXX';
        }

        if (useSignupWithOtp && signupOtpRequested) {
          if (!signupOtp) {
            errors.signupOtp = 'OTP is required';
          } else if (!/^\d{6}$/.test(signupOtp)) {
            errors.signupOtp = 'OTP must be 6 digits';
          }
        }
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setSuccessMessage('');

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (mode === 'login') {
        const result = await login(formData.email, formData.password);
        if (!result.success) {
          setValidationErrors({ general: result.message });
        }
      } else if (mode === 'signup') {
        if (useSignupWithOtp) {
          if (!signupOtpRequested) {
            const otpResult = await sendSignupWhatsAppOtp({
              name: formData.name,
              email: formData.email,
              password: formData.password,
              whatsappNumber: formData.whatsappNumber,
            });

            if (otpResult.success) {
              setSignupOtpRequested(true);
              setSuccessMessage(
                otpResult.devOtp
                  ? `Signup OTP sent. Dev OTP: ${otpResult.devOtp}`
                  : 'Signup OTP sent on your WhatsApp number.'
              );
            } else {
              setValidationErrors({ general: otpResult.message });
            }
          } else {
            const verifyResult = await completeSignupWithOtp({
              email: formData.email,
              otp: signupOtp,
            });
            if (!verifyResult.success) {
              setValidationErrors({ general: verifyResult.message });
            }
          }
        } else {
          const result = await register({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            whatsappNumber: formData.whatsappNumber || undefined,
          });
          if (!result.success) {
            setValidationErrors({ general: result.message });
          }
        }
      } else if (mode === 'forgot') {
        const result = await forgotPassword(formData.email);
        if (result.success) {
          setSuccessMessage(result.message);
          setFormData({ ...formData, email: '' });
        } else {
          setValidationErrors({ general: result.message });
        }
      }
    } catch (err) {
      setValidationErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const nextValue = name === 'whatsappNumber' ? normalizeForInput(value) : value;
    setFormData({ ...formData, [name]: nextValue });
    // Clear error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors({ ...validationErrors, [name]: '' });
    }
    if (validationErrors.general) {
      setValidationErrors({ ...validationErrors, general: '' });
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'signup':
        return 'Create Account';
      case 'forgot':
        return 'Reset Password';
      default:
        return 'Welcome Back';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'signup':
        return 'Start your personalized health journey today';
      case 'forgot':
        return 'Enter your email to receive a reset link';
      default:
        return 'Enter your details to access your health dashboard';
    }
  };

  const handleWhatsAppLoginInput = (e) => {
    const { name, value } = e.target;
    const nextValue = name === 'whatsappNumber' ? normalizeForInput(value) : value;
    setWhatsAppLoginData((prev) => ({ ...prev, [name]: nextValue }));
    if (validationErrors[name]) {
      setValidationErrors({ ...validationErrors, [name]: '' });
    }
    if (validationErrors.general) {
      setValidationErrors({ ...validationErrors, general: '' });
    }
  };

  const handleSendOtp = async () => {
    clearError();
    setSuccessMessage('');
    setValidationErrors({});

    if (!whatsAppLoginData.whatsappNumber) {
      setValidationErrors({ whatsappNumber: 'WhatsApp number is required' });
      return;
    }

    if (!/^\+[1-9]\d{7,14}$/.test(whatsAppLoginData.whatsappNumber)) {
      setValidationErrors({ whatsappNumber: 'Use format like +9198XXXXXXXX' });
      return;
    }

    setIsLoading(true);
    const result = await sendWhatsAppOtp({ whatsappNumber: whatsAppLoginData.whatsappNumber });
    if (result.success) {
      setOtpRequested(true);
      setSuccessMessage(
        result.devOtp ? `OTP sent. Dev OTP: ${result.devOtp}` : 'OTP sent on your WhatsApp number.'
      );
    } else {
      setValidationErrors({ general: result.message });
    }
    setIsLoading(false);
  };

  const handleVerifyOtp = async () => {
    clearError();
    setValidationErrors({});

    if (!whatsAppLoginData.otp) {
      setValidationErrors({ otp: 'OTP is required' });
      return;
    }

    if (!/^\d{6}$/.test(whatsAppLoginData.otp)) {
      setValidationErrors({ otp: 'OTP must be 6 digits' });
      return;
    }

    setIsLoading(true);
    const result = await loginWithWhatsAppOtp({
      whatsappNumber: whatsAppLoginData.whatsappNumber,
      otp: whatsAppLoginData.otp,
    });

    if (!result.success) {
      setValidationErrors({ general: result.message });
    }
    setIsLoading(false);
  };

  const handleSmsLoginInput = (e) => {
    const { name, value } = e.target;
    const nextValue = name === 'phoneNumber' ? normalizeForInput(value) : value;
    setSmsLoginData((prev) => ({ ...prev, [name]: nextValue }));
    if (validationErrors[name]) {
      setValidationErrors({ ...validationErrors, [name]: '' });
    }
    if (validationErrors.general) {
      setValidationErrors({ ...validationErrors, general: '' });
    }
  };

  const handleSendSmsOtp = async () => {
    clearError();
    setSuccessMessage('');
    setValidationErrors({});

    if (!smsLoginData.phoneNumber) {
      setValidationErrors({ phoneNumber: 'Phone number is required' });
      return;
    }

    if (!/^\+[1-9]\d{7,14}$/.test(smsLoginData.phoneNumber)) {
      setValidationErrors({ phoneNumber: 'Use format like +9198XXXXXXXX' });
      return;
    }

    setIsLoading(true);
    const result = await sendSmsOtp({ phoneNumber: smsLoginData.phoneNumber });
    if (result.success) {
      setSmsOtpRequested(true);
      setSuccessMessage(
        result.devOtp ? `OTP sent. Dev OTP: ${result.devOtp}` : 'OTP sent on your SMS number.'
      );
    } else {
      setValidationErrors({ general: result.message });
    }
    setIsLoading(false);
  };

  const handleVerifySmsOtp = async () => {
    clearError();
    setValidationErrors({});

    if (!smsLoginData.otp) {
      setValidationErrors({ smsOtp: 'OTP is required' });
      return;
    }

    if (!/^\d{6}$/.test(smsLoginData.otp)) {
      setValidationErrors({ smsOtp: 'OTP must be 6 digits' });
      return;
    }

    setIsLoading(true);
    const result = await loginWithSmsOtp({
      phoneNumber: smsLoginData.phoneNumber,
      otp: smsLoginData.otp,
    });

    if (!result.success) {
      setValidationErrors({ general: result.message });
    }
    setIsLoading(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-500 to-secondary-500 z-20" />
          <button
            onClick={closeAuthModal}
            className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 transition-colors z-10"
          >
            <X size={20} />
          </button>

          <div className="p-5 sm:p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">{getTitle()}</h2>
              <p className="text-slate-500 text-sm">{getSubtitle()}</p>
            </div>

            {/* Error Message */}
            {(validationErrors.general || error) && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{validationErrors.general || error}</p>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                <CheckCircle size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Field (Signup only) */}
              {mode === 'signup' && (
                <div>
                  <div className="relative">
                    <User
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      size={18}
                    />
                    <input
                      type="text"
                      name="name"
                      placeholder="Full Name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border ${
                        validationErrors.name ? 'border-red-300' : 'border-slate-200'
                      } rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all`}
                    />
                  </div>
                  {validationErrors.name && (
                    <p className="mt-1 text-xs text-red-600">{validationErrors.name}</p>
                  )}
                </div>
              )}

              {/* Email Field */}
              <div>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border ${
                      validationErrors.email ? 'border-red-300' : 'border-slate-200'
                    } rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all`}
                  />
                </div>
                {validationErrors.email && (
                  <p className="mt-1 text-xs text-red-600">{validationErrors.email}</p>
                )}
              </div>

              {/* Password Field (Not in forgot mode) */}
              {mode !== 'forgot' && (
                <div>
                  <div className="relative">
                    <Lock
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      size={18}
                    />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="Password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-12 py-2.5 bg-slate-50 border ${
                        validationErrors.password ? 'border-red-300' : 'border-slate-200'
                      } rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {validationErrors.password && (
                    <p className="mt-1 text-xs text-red-600">{validationErrors.password}</p>
                  )}
                </div>
              )}

              {/* Confirm Password Field (Signup only) */}
              {mode === 'signup' && (
                <div>
                  <div className="relative">
                    <Lock
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      size={18}
                    />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      placeholder="Confirm Password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border ${
                        validationErrors.confirmPassword ? 'border-red-300' : 'border-slate-200'
                      } rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all`}
                    />
                  </div>
                  {validationErrors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-600">{validationErrors.confirmPassword}</p>
                  )}
                </div>
              )}

              {/* WhatsApp Number Field (Signup only) */}
              {mode === 'signup' && (
                <div>
                  <div className="relative">
                    <MessageCircle
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      size={18}
                    />
                    <input
                      type="text"
                      name="whatsappNumber"
                      placeholder="WhatsApp Number (e.g. +919876543210)"
                      value={formData.whatsappNumber}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border ${
                        validationErrors.whatsappNumber ? 'border-red-300' : 'border-slate-200'
                      } rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all`}
                    />
                  </div>
                  {validationErrors.whatsappNumber && (
                    <p className="mt-1 text-xs text-red-600">{validationErrors.whatsappNumber}</p>
                  )}
                </div>
              )}

              {mode === 'signup' && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={useSignupWithOtp}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setUseSignupWithOtp(checked);
                        setSignupOtpRequested(false);
                        setSignupOtp('');
                        setSuccessMessage('');
                        setValidationErrors({});
                      }}
                    />
                    Sign up using WhatsApp OTP
                  </label>
                  {useSignupWithOtp && (
                    <p className="mt-2 text-xs text-slate-500">
                      Name, email, password, confirm password and WhatsApp number is compulsory.
                    </p>
                  )}
                </div>
              )}

              {mode === 'signup' && useSignupWithOtp && signupOtpRequested && (
                <div>
                  <div className="relative">
                    <Lock
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      size={18}
                    />
                    <input
                      type="text"
                      name="signupOtp"
                      placeholder="Enter 6-digit Signup OTP"
                      value={signupOtp}
                      onChange={(e) => {
                        setSignupOtp(e.target.value);
                        if (validationErrors.signupOtp) {
                          setValidationErrors({ ...validationErrors, signupOtp: '' });
                        }
                      }}
                      className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border ${
                        validationErrors.signupOtp ? 'border-red-300' : 'border-slate-200'
                      } rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all`}
                    />
                  </div>
                  {validationErrors.signupOtp && (
                    <p className="mt-1 text-xs text-red-600">{validationErrors.signupOtp}</p>
                  )}
                </div>
              )}

              {/* Forgot Password Link (Login only) */}
              {mode === 'login' && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              <Button type="submit" className="w-full" isLoading={isLoading}>
                {mode === 'login'
                  ? 'Sign In'
                  : mode === 'signup'
                    ? useSignupWithOtp
                      ? signupOtpRequested
                        ? 'Verify OTP & Create Account'
                        : 'Send Signup OTP'
                      : 'Create Account'
                    : 'Send Reset Link'}
              </Button>
            </form>

            {/* Social Login (Login mode only) */}
            {mode === 'login' && (
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-100"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-white text-slate-400">Or continue with</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSmsLogin((prev) => !prev);
                      setShowWhatsAppLogin(false);
                      setSmsOtpRequested(false);
                      setSmsLoginData({ phoneNumber: '', otp: '' });
                      setSuccessMessage('');
                      setValidationErrors({});
                      clearError();
                    }}
                    className="flex items-center justify-center py-2 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors"
                  >
                    <Smartphone size={18} className="mr-2 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">SMS OTP</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowWhatsAppLogin((prev) => !prev);
                      setShowSmsLogin(false);
                      setOtpRequested(false);
                      setWhatsAppLoginData({ whatsappNumber: '', otp: '' });
                      setSuccessMessage('');
                      setValidationErrors({});
                      clearError();
                    }}
                    className="flex items-center justify-center py-2 border border-green-200 rounded-xl hover:bg-green-50 transition-colors"
                  >
                    <MessageCircle size={18} className="mr-2 text-green-600" />
                    <span className="text-sm font-medium text-green-700">WhatsApp OTP</span>
                  </button>
                </div>

                {showSmsLogin && (
                  <div className="mt-4 space-y-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                    <div className="relative">
                      <Smartphone
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        size={18}
                      />
                      <input
                        type="text"
                        name="phoneNumber"
                        placeholder="Phone Number (e.g. +919876543210)"
                        value={smsLoginData.phoneNumber}
                        onChange={handleSmsLoginInput}
                        className={`w-full pl-10 pr-4 py-2.5 bg-white border ${
                          validationErrors.phoneNumber ? 'border-red-300' : 'border-slate-200'
                        } rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all`}
                      />
                    </div>
                    {validationErrors.phoneNumber && (
                      <p className="-mt-1 text-xs text-red-600">{validationErrors.phoneNumber}</p>
                    )}

                    {smsOtpRequested && (
                      <>
                        <div className="relative">
                          <Lock
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            size={18}
                          />
                          <input
                            type="text"
                            name="otp"
                            placeholder="Enter 6-digit OTP"
                            value={smsLoginData.otp}
                            onChange={handleSmsLoginInput}
                            className={`w-full pl-10 pr-4 py-2.5 bg-white border ${
                              validationErrors.smsOtp ? 'border-red-300' : 'border-slate-200'
                            } rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all`}
                          />
                        </div>
                        {validationErrors.smsOtp && (
                          <p className="-mt-1 text-xs text-red-600">{validationErrors.smsOtp}</p>
                        )}
                      </>
                    )}

                    <Button
                      type="button"
                      className="w-full"
                      isLoading={isLoading}
                      onClick={smsOtpRequested ? handleVerifySmsOtp : handleSendSmsOtp}
                    >
                      {smsOtpRequested ? 'Verify OTP & Sign In' : 'Send OTP on SMS'}
                    </Button>
                  </div>
                )}

                {showWhatsAppLogin && (
                  <div className="mt-4 space-y-3 p-3 bg-green-50 border border-green-100 rounded-xl">
                    <div className="relative">
                      <MessageCircle
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        size={18}
                      />
                      <input
                        type="text"
                        name="whatsappNumber"
                        placeholder="WhatsApp Number (e.g. +919876543210)"
                        value={whatsAppLoginData.whatsappNumber}
                        onChange={handleWhatsAppLoginInput}
                        className={`w-full pl-10 pr-4 py-2.5 bg-white border ${
                          validationErrors.whatsappNumber ? 'border-red-300' : 'border-slate-200'
                        } rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all`}
                      />
                    </div>
                    {validationErrors.whatsappNumber && (
                      <p className="-mt-1 text-xs text-red-600">
                        {validationErrors.whatsappNumber}
                      </p>
                    )}

                    {otpRequested && (
                      <>
                        <div className="relative">
                          <Lock
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            size={18}
                          />
                          <input
                            type="text"
                            name="otp"
                            placeholder="Enter 6-digit OTP"
                            value={whatsAppLoginData.otp}
                            onChange={handleWhatsAppLoginInput}
                            className={`w-full pl-10 pr-4 py-2.5 bg-white border ${
                              validationErrors.otp ? 'border-red-300' : 'border-slate-200'
                            } rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all`}
                          />
                        </div>
                        {validationErrors.otp && (
                          <p className="-mt-1 text-xs text-red-600">{validationErrors.otp}</p>
                        )}
                      </>
                    )}

                    <Button
                      type="button"
                      className="w-full"
                      isLoading={isLoading}
                      onClick={otpRequested ? handleVerifyOtp : handleSendOtp}
                    >
                      {otpRequested ? 'Verify OTP & Sign In' : 'Send OTP on WhatsApp'}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Footer Links */}
            <div className="mt-6 text-center">
              {mode === 'forgot' ? (
                <p className="text-sm text-slate-500">
                  Remember your password?{' '}
                  <button
                    onClick={() => setMode('login')}
                    className="text-primary-600 font-semibold hover:text-primary-700"
                  >
                    Back to Login
                  </button>
                </p>
              ) : (
                <p className="text-sm text-slate-500">
                  {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                  <button
                    onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                    className="text-primary-600 font-semibold hover:text-primary-700"
                  >
                    {mode === 'login' ? 'Sign Up' : 'Log In'}
                  </button>
                </p>
              )}
            </div>

            {/* Security Note */}
            {mode === 'signup' && (
              <p className="mt-4 text-xs text-center text-slate-400">
                By signing up, you agree to our Terms of Service and Privacy Policy
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AuthModal;
