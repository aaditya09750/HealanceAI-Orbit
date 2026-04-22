import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import OnboardingModal from '../components/OnboardingModal';
import { Menu, Bell, X, Check, Clock, Target, Heart, Loader2 } from 'lucide-react';
import ConfirmDialog from '../../shared/ui/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { ToastProvider } from '../../context/ToastContext';
import axios from 'axios';

const ONBOARDING_SKIP_KEY = 'healance_onboarding_skipped';
import { API_URL } from '../../constants/config';

// Page config for dynamic titles
const pageConfig = {
  '/dashboard': {
    kicker: 'Dashboard',
    title: (name) => `Welcome back, ${name} 👋`,
    subtitle: "Here's your health overview for today.",
  },
  '/dashboard/risk-prediction': {
    kicker: 'Risk Prediction',
    title: () => 'Symptoms Disease Prediction',
    subtitle: 'Select symptoms and get AI-guided disease insights.',
  },
  '/dashboard/risk-prediction/heart-diabetes': {
    kicker: 'Heart & Diabetes',
    title: () => 'Heart & Diabetes Check',
    subtitle: 'Specialized cardiac and metabolic analysis.',
  },
  '/dashboard/chatbots': {
    kicker: 'AI Chatbots',
    title: () => 'Health & Medicine Assistant',
    subtitle: 'Chat with our AI-powered health bots.',
  },
  '/dashboard/body-explorer': {
    kicker: 'Body Explorer',
    title: () => '3D Anatomy Viewer',
    subtitle: 'Explore the human body interactively.',
  },
  '/dashboard/reverse-planner': {
    kicker: 'Reverse Planner',
    title: () => 'Health Goal Tracker',
    subtitle: 'Set goals and track your progress.',
  },
  '/dashboard/forecast': {
    kicker: 'Forecast',
    title: () => 'Health Weather Forecast',
    subtitle: 'Plan activities based on conditions.',
  },
  '/dashboard/blogs': {
    kicker: 'Knowledge Base',
    title: () => 'Health Articles',
    subtitle: 'Curated content for healthier living.',
  },
  '/dashboard/prediction-history': {
    kicker: 'Prediction History',
    title: () => 'All Saved Predictions',
    subtitle: 'Open any entry to view complete details.',
  },
  '/dashboard/contact': {
    kicker: 'Support',
    title: () => 'Support Center',
    subtitle: 'Get help from our team.',
  },
  '/dashboard/profile': {
    kicker: 'Account',
    title: () => 'Profile Settings',
    subtitle: 'Manage your account and health data.',
  },
};

// Notification Panel Component
const NotificationPanel = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
  onClearAll,
  isLoading,
}) => {
  const markAllRef = useRef(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    markAllRef.current?.focus();
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end p-4 bg-[#0b1030]/30 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Notifications"
    >
      <div
        className="bg-white rounded-[20px] w-full max-w-md max-h-[80vh] overflow-hidden mt-16 mr-4"
        style={{ boxShadow: '0 22px 38px rgba(11, 16, 48, 0.11)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-[#e8eaf9] p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Bell size={20} className="text-[#506cd7]" />
            <h3 className="text-lg font-bold text-[#0b1030] font-heading">Notifications</h3>
            {notifications.filter((n) => !n.isRead).length > 0 && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                {notifications.filter((n) => !n.isRead).length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              ref={markAllRef}
              onClick={onMarkAllRead}
              className="text-xs font-medium text-[#506cd7] hover:text-[#4753bf]"
            >
              Mark all read
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-[#f0f1fc] rounded-lg"
              aria-label="Close notifications"
            >
              <X size={18} className="text-[#5f697a]" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto scrollbar-hide max-h-[60vh]">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 size={24} className="animate-spin text-primary-500" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 hover:bg-slate-50 transition-colors ${!notification.isRead ? 'bg-blue-50/50' : ''}`}
                >
                  <div className="flex gap-3">
                    <div
                      className={`p-2 rounded-lg flex-shrink-0 ${
                        notification.type === 'reminder'
                          ? 'bg-blue-100'
                          : notification.type === 'achievement'
                            ? 'bg-yellow-100'
                            : notification.type === 'health'
                              ? 'bg-red-100'
                              : 'bg-slate-100'
                      }`}
                    >
                      {notification.type === 'reminder' ? (
                        <Clock size={16} className="text-blue-600" />
                      ) : notification.type === 'achievement' ? (
                        <Target size={16} className="text-yellow-600" />
                      ) : notification.type === 'health' ? (
                        <Heart size={16} className="text-red-600" />
                      ) : (
                        <Bell size={16} className="text-slate-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-sm font-semibold text-slate-800 truncate">
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <button
                            onClick={() => onMarkRead(notification._id)}
                            className="text-primary-600 hover:text-primary-700"
                          >
                            <Check size={14} />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{notification.message}</p>
                      <p className="text-[10px] text-slate-400 mt-2">
                        {new Date(notification.createdAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <div className="border-t border-[#e8eaf9] p-3">
            <button
              onClick={() => setShowClearConfirm(true)}
              className="w-full text-center text-sm text-red-500 hover:text-red-600 py-2 transition-colors"
            >
              Clear all notifications
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={showClearConfirm}
        title="Clear all notifications?"
        description="This will permanently delete all your notifications. This action cannot be undone."
        confirmLabel="Clear All"
        variant="danger"
        onConfirm={() => {
          onClearAll();
          setShowClearConfirm(false);
        }}
        onClose={() => setShowClearConfirm(false)}
      />
    </div>
  );
};

const DashboardLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isNotificationLoading, setIsNotificationLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Show onboarding modal for users with incomplete medical profile
  useEffect(() => {
    if (!user) return;
    const p = user.profile || {};
    const isIncomplete = !p.age || !p.gender || !p.height || !p.weight || !p.bloodGroup;
    const wasSkipped = sessionStorage.getItem(ONBOARDING_SKIP_KEY) === 'true';
    if (isIncomplete && !wasSkipped) {
      const timer = setTimeout(() => setShowOnboarding(true), 600);
      return () => clearTimeout(timer);
    }
    setShowOnboarding(false);
  }, [user]);

  const handleSkipOnboarding = () => {
    sessionStorage.setItem(ONBOARDING_SKIP_KEY, 'true');
    setShowOnboarding(false);
  };

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    setIsNotificationLoading(true);
    try {
      const response = await axios.get(`${API_URL}/notifications`, { withCredentials: true });
      if (response.data.success) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount);
      }
    } catch (err) {
      console.error('Failed to fetch notifications');
    } finally {
      setIsNotificationLoading(false);
    }
  }, []);

  // Mark notification as read
  const markAsRead = async (id) => {
    try {
      await axios.put(`${API_URL}/notifications/${id}/read`, {}, { withCredentials: true });
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark as read');
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await axios.put(`${API_URL}/notifications/read-all`, {}, { withCredentials: true });
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark all as read');
    }
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    try {
      await axios.delete(`${API_URL}/notifications/clear-all`, { withCredentials: true });
      fetchNotifications();
    } catch (err) {
      console.error('Failed to clear notifications');
    }
  };

  // Dynamic page config
  const config = pageConfig[location.pathname] || pageConfig['/dashboard'];
  const firstName = user?.name?.split(' ')[0] || 'User';
  const pageTitle = config.title(firstName);

  // Set document title on route change
  useEffect(() => {
    document.title = `${config.kicker} | Healance AI`;
  }, [config.kicker]);

  // Poll notifications only when tab is visible
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') fetchNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const bellLabel = unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications';

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#f3f3ff] flex">
        {/* Skip to content */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[70] focus:bg-[#506cd7] focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm"
        >
          Skip to main content
        </a>

        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 lg:ml-64 min-h-screen flex flex-col">
          {/* Mobile Header */}
          <div className="lg:hidden sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-[#e8eaf9] px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2.5 text-[#5f697a] hover:text-[#0b1030] hover:bg-[#f0f1fc] rounded-lg"
              aria-label="Open navigation menu"
            >
              <Menu size={24} />
            </button>
            <span className="text-sm font-heading font-bold text-[#0b1030] truncate max-w-[140px]">
              {config.kicker}
            </span>
            <button
              onClick={() => setIsNotificationOpen(true)}
              className="relative p-2.5 hover:bg-[#f0f1fc] rounded-lg transition-colors"
              aria-label={bellLabel}
            >
              <Bell size={20} className="text-[#5f697a]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>

          <div id="main-content" className="p-4 sm:p-6 lg:p-8 flex-1">
            {/* Desktop Header */}
            <header className="hidden lg:flex justify-between items-center mb-8">
              <div>
                <p className="dash-kicker mb-1">{config.kicker}</p>
                <h1 className="text-2xl font-heading font-bold text-[#0b1030]">{pageTitle}</h1>
                <p className="text-[#5f697a]">{config.subtitle}</p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsNotificationOpen(true)}
                  className="relative p-2.5 hover:bg-[#f0f1fc] rounded-lg transition-colors"
                  aria-label={bellLabel}
                >
                  <Bell size={20} className="text-[#5f697a]" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              </div>
            </header>

            {/* Mobile Welcome Message */}
            <div className="lg:hidden mb-6">
              <p className="dash-kicker mb-1">{config.kicker}</p>
              <h1 className="text-xl sm:text-2xl font-heading font-bold text-[#0b1030]">
                {pageTitle}
              </h1>
              <p className="text-sm text-[#5f697a]">{config.subtitle}</p>
            </div>

            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </div>

          {/* Notification Panel */}
          <NotificationPanel
            isOpen={isNotificationOpen}
            onClose={() => setIsNotificationOpen(false)}
            notifications={notifications}
            onMarkRead={markAsRead}
            onMarkAllRead={markAllAsRead}
            onClearAll={clearAllNotifications}
            isLoading={isNotificationLoading}
          />

          {/* Onboarding Modal — shows for new users with incomplete profile */}
          <OnboardingModal
            isOpen={showOnboarding}
            onClose={() => setShowOnboarding(false)}
            onSkip={handleSkipOnboarding}
          />
        </main>
      </div>
    </ToastProvider>
  );
};

export default DashboardLayout;
