import axios from 'axios';
import { API_URL } from '../constants/config';

// Create axios instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send cookies with requests
});

let refreshRequest = null;

const RATE_LIMIT_MAX_RETRIES = 2;
const RATE_LIMIT_DEFAULT_DELAY_MS = 1200;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getRetryDelayMs = (error) => {
  const retryAfter = error?.response?.headers?.['retry-after'];
  const asNumber = Number(retryAfter);
  if (Number.isFinite(asNumber) && asNumber > 0) {
    return Math.min(asNumber * 1000, 10000);
  }
  return RATE_LIMIT_DEFAULT_DELAY_MS;
};

const refreshAccessToken = async () => {
  if (!refreshRequest) {
    refreshRequest = api.post('/auth/refresh').finally(() => {
      refreshRequest = null;
    });
  }

  return refreshRequest;
};

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const status = error.response?.status;
    const requestUrl = originalRequest.url || '';

    const isAuthEndpoint =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/refresh') ||
      requestUrl.includes('/auth/logout');

    if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        await refreshAccessToken();
        return api(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    // Handle temporary rate limiting by retrying the same request with a small backoff.
    if (status === 429) {
      const retryCount = originalRequest._rateLimitRetryCount || 0;
      if (retryCount < RATE_LIMIT_MAX_RETRIES) {
        originalRequest._rateLimitRetryCount = retryCount + 1;
        await sleep(getRetryDelayMs(error));
        return api(originalRequest);
      }

      console.error('Too many requests. Please wait a moment before trying again.');
    }

    return Promise.reject(error);
  }
);

// ==================== AUTH SERVICES ====================

export const authService = {
  // Register new user
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Login user
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Send WhatsApp OTP for login
  sendWhatsAppLoginOtp: async (payload) => {
    const response = await api.post('/whatsapp/send-login-otp', payload);
    return response.data;
  },

  // Verify WhatsApp OTP and login
  verifyWhatsAppLoginOtp: async (payload) => {
    const response = await api.post('/whatsapp/verify-login-otp', payload);
    return response.data;
  },

  // Send SMS OTP for login
  sendSmsLoginOtp: async (payload) => {
    const response = await api.post('/sms/send-login-otp', payload);
    return response.data;
  },

  // Verify SMS OTP and login
  verifySmsLoginOtp: async (payload) => {
    const response = await api.post('/sms/verify-login-otp', payload);
    return response.data;
  },

  // Send WhatsApp OTP for signup
  sendWhatsAppSignupOtp: async (payload) => {
    const response = await api.post('/whatsapp/send-signup-otp', payload);
    return response.data;
  },

  // Verify WhatsApp signup OTP and create account
  verifyWhatsAppSignupOtp: async (payload) => {
    const response = await api.post('/whatsapp/verify-signup-otp', payload);
    return response.data;
  },

  // Logout user
  logout: async () => {
    await api.post('/auth/logout');
  },

  // Refresh session access token
  refresh: async () => {
    const response = await api.post('/auth/refresh');
    return response.data;
  },

  // Get current user
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Forgot password
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Reset password
  resetPassword: async (resetToken, password) => {
    const response = await api.put(`/auth/reset-password/${resetToken}`, { password });
    return response.data;
  },

  // Update password (when logged in)
  updatePassword: async (currentPassword, newPassword) => {
    const response = await api.put('/auth/update-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  // Update logged-in user profile
  updateProfile: async (payload) => {
    const response = await api.put('/users/profile', payload);
    return response.data;
  },

  uploadProfileAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await api.post('/users/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data;
  },

  // Social login (Google/GitHub)
  socialLogin: async (socialData) => {
    const response = await api.post('/auth/social', socialData);
    return response.data;
  },
};

// ==================== HEALTH DATA SERVICES ====================

export const healthService = {
  // Get user health data
  getHealthData: async () => {
    const response = await api.get('/health-data');
    return response.data;
  },

  // Add health data
  addHealthData: async (data) => {
    const response = await api.post('/health-data', data);
    return response.data;
  },

  // Get latest health snapshot
  getLatest: async () => {
    const response = await api.get('/health-data/latest');
    return response.data;
  },

  // Upload a medical report file (PDF/image/docx)
  uploadReport: async (file, meta = {}) => {
    const formData = new FormData();
    formData.append('report', file);
    if (meta.title) formData.append('title', meta.title);
    if (meta.type) formData.append('type', meta.type);

    const response = await api.post('/health-data/reports', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

// ==================== BLOG SERVICES ====================

export const blogService = {
  // Get all blogs
  getBlogs: async (params) => {
    const response = await api.get('/blogs', { params });
    return response.data;
  },

  // Get single blog
  getBlog: async (identifier) => {
    const response = await api.get(`/blogs/${identifier}`);
    return response.data;
  },

  // Get trending blogs
  getTrending: async () => {
    const response = await api.get('/blogs/trending');
    return response.data;
  },

  // Like a blog
  likeBlog: async (blogId) => {
    const response = await api.post(`/blogs/${blogId}/like`);
    return response.data;
  },
};

// ==================== RISK PREDICTION SERVICES ====================

export const riskService = {
  // Analyze health risks
  analyzeRisk: async (data) => {
    const response = await api.post('/risk-prediction/analyze', data);
    return response.data;
  },

  // Get risk history
  getRiskHistory: async (params = {}) => {
    const response = await api.get('/risk-prediction/history', { params });
    return response.data;
  },

  // Get latest risk assessment
  getLatestRisk: async () => {
    const response = await api.get('/risk-prediction/latest');
    return response.data;
  },

  predictDiabetes: async (data) => {
    const response = await api.post('/predict/diabetes', data);
    return response.data;
  },

  predictHeart: async (data) => {
    const response = await api.post('/predict/heart', data);
    return response.data;
  },

  predictAll: async (data) => {
    const response = await api.post('/predict/all', data);
    return response.data;
  },

  predictSymptomsDisease: async (data) => {
    const response = await api.post('/predict/symptoms-disease', data);
    return response.data;
  },

  getAdaptiveQuestions: async (payload) => {
    const response = await api.post('/predict/adaptive-questions', payload);
    return response.data;
  },

  getSymptomsPredictionHistory: async (options = 5) => {
    const params = typeof options === 'number' ? { limit: options } : options;
    const response = await api.get('/predict/symptoms-history', { params });
    return response.data;
  },

  shareToWhatsapp: async (data) => {
    const response = await api.post('/predict/share-whatsapp', data);
    return response.data;
  },

  shareSymptomsToWhatsapp: async (data) => {
    const response = await api.post('/predict/share-symptoms-whatsapp', data);
    return response.data;
  },
};

// ==================== CHATBOT SERVICES ====================

export const chatbotService = {
  // Send message to chatbot
  sendMessage: async ({ sessionId, message, botType }) => {
    const response = await api.post('/chatbot/message', { sessionId, message, botType });
    return response.data;
  },

  // Get chat sessions
  getSessions: async () => {
    const response = await api.get('/chatbot/sessions');
    return response.data;
  },

  // Get session messages
  getSessionMessages: async (sessionId) => {
    const response = await api.get(`/chatbot/sessions/${sessionId}`);
    return response.data;
  },

  // Delete session
  deleteSession: async (sessionId) => {
    const response = await api.delete(`/chatbot/sessions/${sessionId}`);
    return response.data;
  },

  // Analyze an uploaded medical report with Gemini.
  // `reportId` comes from healthService.uploadReport().
  analyzeReport: async (reportId) => {
    const response = await api.post(`/chatbot/analyze-report/${reportId}`);
    return response.data;
  },

  // Explain a single medication — returns FDA drug label info + class + interaction matches
  // against the user's current medications.
  explainMedicine: async ({ name, userMedications = [] }) => {
    const response = await api.post('/chatbot/explain-medicine', { name, userMedications });
    return response.data;
  },

  // Find nearby doctors (seeded partners + OSM fallback). Pass lat/lon when
  // geolocation is granted, or city when the user enters one manually.
  getNearbyDoctors: async ({ specialty, lat, lon, city, radius }) => {
    const response = await api.post('/chatbot/nearby-doctors', {
      specialty,
      lat,
      lon,
      city,
      radius,
    });
    return response.data;
  },

  // Resolve a city name to lat/lon (used when geolocation is denied).
  geocode: async (city) => {
    const response = await api.post('/chatbot/geocode', { city });
    return response.data;
  },
};

// ==================== GOAL SERVICES ====================

export const goalService = {
  // Get user goals
  getGoals: async () => {
    const response = await api.get('/goals');
    return response.data;
  },

  // Create goal
  createGoal: async (goalData) => {
    const response = await api.post('/goals', goalData);
    return response.data;
  },

  // Update goal
  updateGoal: async (goalId, updates) => {
    const response = await api.put(`/goals/${goalId}`, updates);
    return response.data;
  },

  // Log progress
  logProgress: async (goalId, value) => {
    const response = await api.post(`/goals/${goalId}/progress`, { value });
    return response.data;
  },

  // Delete goal
  deleteGoal: async (goalId) => {
    const response = await api.delete(`/goals/${goalId}`);
    return response.data;
  },

  // Get AI suggestions
  getSuggestions: async () => {
    const response = await api.get('/goals/suggestions');
    return response.data;
  },
};

// ==================== WALK & EARN SERVICES ====================

export const walkEarnService = {
  // Summary including 7-day weeklyData, coins, today's steps
  getSummary: async () => {
    const response = await api.get('/walk-earn/summary');
    return response.data;
  },

  // Get rewards catalog
  getRewards: async () => {
    const response = await api.get('/walk-earn/rewards');
    return response.data;
  },

  // Redeem reward
  redeemReward: async (rewardId) => {
    const response = await api.post(`/walk-earn/redeem/${rewardId}`);
    return response.data;
  },

  // Get redemption history
  getRedemptions: async () => {
    const response = await api.get('/walk-earn/redemptions');
    return response.data;
  },

  // Log steps
  logSteps: async (steps, date) => {
    const response = await api.post('/walk-earn/log-steps', { steps, date });
    return response.data;
  },
};

// ==================== FORECAST SERVICES ====================

export const forecastService = {
  // Get health forecast
  getForecast: async (params) => {
    const response = await api.get('/forecast', { params });
    return response.data;
  },

  // Get weekly forecast
  getWeeklyForecast: async () => {
    const response = await api.get('/forecast/weekly');
    return response.data;
  },
};

// ==================== CONTACT SERVICES ====================

export const contactService = {
  // Submit contact form
  submitContact: async (data) => {
    const response = await api.post('/contact', data);
    return response.data;
  },

  // Submit support ticket
  submitTicket: async (formData) => {
    const response = await api.post('/contact/ticket', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get my tickets
  getMyTickets: async () => {
    const response = await api.get('/contact/tickets');
    return response.data;
  },
};

// ==================== BODY EXPLORER SERVICES ====================

export const bodyExplorerService = {
  // List all body parts, with optional fuzzy search / system filter / gender
  listParts: async (params = {}) => {
    const response = await api.get('/body-explorer', { params });
    return response.data;
  },

  // Fetch a single body part by name (e.g. "Heart")
  getPart: async (partName) => {
    const response = await api.get(`/body-explorer/${encodeURIComponent(partName)}`);
    return response.data;
  },

  // Meta: distinct systems available in the catalog (for filter UI)
  listSystems: async () => {
    const response = await api.get('/body-explorer/meta/systems');
    return response.data;
  },
};

// ==================== DASHBOARD SERVICES ====================

export const dashboardService = {
  // Composite summary: healthScore, streak, today totals, next action
  getSummary: async () => {
    const response = await api.get('/dashboard/summary');
    return response.data;
  },

  // Per-day series for the trends chart. range = '7d' | '30d'
  getTrends: async (range = '7d') => {
    const response = await api.get('/dashboard/trends', { params: { range } });
    return response.data;
  },

  // LLM-backed insights (with rule-based fallback server-side)
  getInsights: async () => {
    const response = await api.get('/dashboard/insights');
    return response.data;
  },
};

export default api;
