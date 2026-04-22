import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

const AuthContext = createContext();
const AUTH_USER_STORAGE_KEY = 'healance_auth_user';

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem(AUTH_USER_STORAGE_KEY);
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const navigate = useNavigate();

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const setAuthUser = (nextUser) => {
    setUser(nextUser);

    if (nextUser) {
      localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(nextUser));
    } else {
      localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    }
  };

  const checkAuth = async () => {
    // Prevent multiple simultaneous auth checks
    if (isCheckingAuth) return;

    setIsCheckingAuth(true);
    try {
      const data = await authService.getMe();
      setAuthUser(data.user || null);
    } catch (error) {
      // Keep existing session on transient failures during dev restarts/network blips.
      if (error.response?.status === 401 || error.response?.status === 403) {
        setAuthUser(null);
      }
    } finally {
      setIsCheckingAuth(false);
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const data = await authService.register(userData);
      setAuthUser(data.user);
      setIsAuthModalOpen(false);
      navigate('/dashboard');
      return { success: true, user: data.user };
    } catch (error) {
      let message = 'Registration failed. Please try again.';

      if (error.response?.status === 429) {
        message = 'Too many registration attempts. Please wait a few minutes and try again.';
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }

      setError(message);
      return { success: false, message };
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const data = await authService.login({ email, password });
      setAuthUser(data.user);
      setIsAuthModalOpen(false);
      navigate('/dashboard');
      return { success: true, user: data.user };
    } catch (error) {
      let message = 'Login failed. Please check your credentials.';

      // Handle specific error cases
      if (error.response?.status === 429) {
        message = 'Too many login attempts. Please wait a few minutes and try again.';
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }

      setError(message);
      return { success: false, message };
    }
  };

  const sendWhatsAppOtp = async ({ whatsappNumber }) => {
    try {
      setError(null);
      const data = await authService.sendWhatsAppLoginOtp({ whatsappNumber });
      return { success: true, message: data.message, devOtp: data.devOtp };
    } catch (error) {
      let message = 'Failed to send WhatsApp OTP.';

      if (error.response?.status === 429) {
        message = 'Too many OTP requests. Please wait and try again.';
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }

      setError(message);
      return { success: false, message };
    }
  };

  const loginWithWhatsAppOtp = async ({ whatsappNumber, otp }) => {
    try {
      setError(null);
      const data = await authService.verifyWhatsAppLoginOtp({ whatsappNumber, otp });
      setAuthUser(data.user);
      setIsAuthModalOpen(false);
      navigate('/dashboard');
      return { success: true, user: data.user };
    } catch (error) {
      let message = 'WhatsApp OTP login failed.';

      if (error.response?.status === 429) {
        message = 'Too many attempts. Please wait and try again.';
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }

      setError(message);
      return { success: false, message };
    }
  };

  const sendSmsOtp = async ({ phoneNumber }) => {
    try {
      setError(null);
      const data = await authService.sendSmsLoginOtp({ phoneNumber });
      return { success: true, message: data.message, devOtp: data.devOtp };
    } catch (error) {
      let message = 'Failed to send SMS OTP.';

      if (error.response?.status === 429) {
        message = 'Too many OTP requests. Please wait and try again.';
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }

      setError(message);
      return { success: false, message };
    }
  };

  const loginWithSmsOtp = async ({ phoneNumber, otp }) => {
    try {
      setError(null);
      const data = await authService.verifySmsLoginOtp({ phoneNumber, otp });
      setAuthUser(data.user);
      setIsAuthModalOpen(false);
      navigate('/dashboard');
      return { success: true, user: data.user };
    } catch (error) {
      let message = 'SMS OTP login failed.';

      if (error.response?.status === 429) {
        message = 'Too many attempts. Please wait and try again.';
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }

      setError(message);
      return { success: false, message };
    }
  };

  const sendSignupWhatsAppOtp = async ({ name, email, password, whatsappNumber }) => {
    try {
      setError(null);
      const data = await authService.sendWhatsAppSignupOtp({
        name,
        email,
        password,
        whatsappNumber,
      });
      return { success: true, message: data.message, devOtp: data.devOtp };
    } catch (error) {
      let message = 'Failed to send signup OTP.';

      if (error.response?.status === 429) {
        message = 'Too many OTP requests. Please wait and try again.';
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }

      setError(message);
      return { success: false, message };
    }
  };

  const completeSignupWithOtp = async ({ email, otp }) => {
    try {
      setError(null);
      const data = await authService.verifyWhatsAppSignupOtp({ email, otp });
      setAuthUser(data.user);
      setIsAuthModalOpen(false);
      navigate('/dashboard');
      return { success: true, user: data.user };
    } catch (error) {
      let message = 'Signup OTP verification failed.';

      if (error.response?.status === 429) {
        message = 'Too many attempts. Please wait and try again.';
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }

      setError(message);
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAuthUser(null);
      navigate('/');
    }
  };

  const forgotPassword = async (email) => {
    try {
      setError(null);
      const data = await authService.forgotPassword(email);
      return { success: true, message: data.message };
    } catch (error) {
      let message = 'Failed to send reset email.';

      if (error.response?.status === 429) {
        message = 'Too many password reset requests. Please wait before trying again.';
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }

      setError(message);
      return { success: false, message };
    }
  };

  const resetPassword = async (resetToken, password) => {
    try {
      setError(null);
      const data = await authService.resetPassword(resetToken, password);
      setAuthUser(data.user);
      navigate('/dashboard');
      return { success: true, message: 'Password reset successful!' };
    } catch (error) {
      const message = error.response?.data?.message || 'Password reset failed.';
      setError(message);
      return { success: false, message };
    }
  };

  const updatePassword = async (currentPassword, newPassword) => {
    try {
      setError(null);
      await authService.updatePassword(currentPassword, newPassword);
      return { success: true, message: 'Password updated successfully!' };
    } catch (error) {
      const message = error.response?.data?.message || 'Password update failed.';
      setError(message);
      return { success: false, message };
    }
  };

  const socialLogin = async (provider, userData) => {
    try {
      setError(null);
      const data = await authService.socialLogin(userData);
      setAuthUser(data.user);
      setIsAuthModalOpen(false);
      navigate('/dashboard');
      return { success: true, user: data.user };
    } catch (error) {
      const message = error.response?.data?.message || 'Social login failed.';
      setError(message);
      return { success: false, message };
    }
  };

  const updateUser = (updatedUser) => {
    setAuthUser(updatedUser);
  };

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setError(null);
  };
  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        register,
        login,
        sendWhatsAppOtp,
        loginWithWhatsAppOtp,
        sendSmsOtp,
        loginWithSmsOtp,
        sendSignupWhatsAppOtp,
        completeSignupWithOtp,
        logout,
        forgotPassword,
        resetPassword,
        updatePassword,
        socialLogin,
        updateUser,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        isAuthenticated: !!user,
        loading,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
