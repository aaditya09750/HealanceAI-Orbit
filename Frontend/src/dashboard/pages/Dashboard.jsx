import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Heart,
  TrendingUp,
  Footprints,
  Droplets,
  Target,
  CloudSun,
  Bell,
  BellRing,
  X,
  Plus,
  Minus,
  Volume2,
  CheckCircle,
  Brain,
  ArrowRight,
} from 'lucide-react';
import Button from '../../shared/ui/Button';
import {
  SkeletonCard,
  SkeletonChart,
  SkeletonRiskCard,
  SkeletonHero,
  SkeletonQuickActions,
} from '../../shared/ui/Skeleton';
import DashReveal from '../../shared/ui/DashReveal';
import Sparkline from '../../shared/ui/Sparkline';
import axios from 'axios';
import { useHealthData } from '../../context/HealthDataContext';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../constants/config';
import { riskService, dashboardService, walkEarnService } from '../../services/api';
import { useNavigate } from 'react-router-dom';

// New upgrade components
import HealthScoreHero from '../components/dashboard/HealthScoreHero';
import QuickActionsBar from '../components/dashboard/QuickActionsBar';
import WeeklyTrendsChart from '../components/dashboard/WeeklyTrendsChart';
import TodayFocusCard from '../components/dashboard/TodayFocusCard';
import SmartInsightsCard from '../components/dashboard/SmartInsightsCard';
import RecentPredictionsCard from '../components/dashboard/RecentPredictionsCard';

// ------------------------------------------------------------------
// Enhanced stat card — supports sparkline, mini progress bars, activity chip
// ------------------------------------------------------------------
const EnhancedStatCard = ({
  title,
  value,
  unit,
  icon: Icon,
  iconClass,
  subtext,
  sparklineData,
  progressBars,
  activityChip,
  trendPct,
  onAction,
  actionLabel,
}) => (
  <div className="dash-card dash-card-glow h-full !p-4 sm:!p-5">
    <div className="flex justify-between items-start mb-2 sm:mb-4 gap-2">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] sm:text-sm font-medium text-[#5f697a] truncate">{title}</p>
        <h3 className="text-lg sm:text-2xl font-heading font-bold text-[#0b1030] mt-0.5 sm:mt-1 truncate">
          {value} <span className="text-[10px] sm:text-sm font-normal text-[#6a7283]">{unit}</span>
        </h3>
      </div>
      <div
        className={`dash-icon-badge ${iconClass} flex-shrink-0`}
        style={{ width: 36, height: 36 }}
      >
        <Icon size={16} className="text-white" />
      </div>
    </div>

    {sparklineData && sparklineData.length > 0 && (
      <div className="mb-2 flex items-end justify-between gap-2">
        <Sparkline data={sparklineData} width={70} height={22} />
        {typeof trendPct === 'number' && (
          <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-emerald-600 flex-shrink-0">
            <TrendingUp size={10} />+{Math.abs(trendPct)}%
          </span>
        )}
      </div>
    )}

    {progressBars && progressBars.length > 0 && (
      <div className="space-y-2 mb-2">
        {progressBars.map((bar, i) => (
          <div key={i}>
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] mb-1 gap-2">
              <span className="text-[#0b1030] font-medium truncate flex-1 min-w-0">
                {bar.label}
              </span>
              <span className="text-[#6a7283] font-semibold flex-shrink-0">{bar.pct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-[#f0f1fc] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${bar.pct}%`,
                  background: bar.gradient || 'linear-gradient(90deg, #10b981, #34d399)',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    )}

    {activityChip && (
      <div className="flex items-center gap-1.5 text-xs text-[#5f697a] mt-1">
        <span
          className="inline-block w-1.5 h-1.5 rounded-full"
          style={{ background: activityChip.color }}
        />
        <span className="truncate">{activityChip.text}</span>
      </div>
    )}

    {subtext && !activityChip && !progressBars && (
      <div className="text-xs sm:text-sm text-[#5f697a]">{subtext}</div>
    )}

    {onAction && (
      <button
        onClick={onAction}
        className="mt-3 w-full text-xs font-medium text-[#506cd7] hover:text-[#4753bf] flex items-center justify-center gap-1 py-2 bg-[#f0f1fc] hover:bg-[#e8eaf9] rounded-lg transition-colors"
      >
        <Bell size={12} /> {actionLabel || 'Set Reminder'}
      </button>
    )}
  </div>
);

// ------------------------------------------------------------------
// Water tracker (kept — just re-styled to match new badge system)
// ------------------------------------------------------------------
const WaterTracker = ({ onSetReminder, reminderActive, reminderInterval }) => {
  const { waterIntake, addWater, removeWater, updateGoalProgress, activeGoals } = useHealthData();
  const glasses = Math.floor(waterIntake * 4);
  const target = 12;
  const remaining = Math.max(target - glasses, 0);
  const pct = Math.min(100, Math.round((waterIntake / 3) * 100));

  const waterGoal = activeGoals.find((g) => g.type === 'water');

  const handleAddGlass = async () => {
    const newValue = Math.min(waterIntake + 0.25, 3);
    addWater();
    if (waterGoal) await updateGoalProgress('water', newValue);
  };
  const handleRemoveGlass = async () => {
    const newValue = Math.max(waterIntake - 0.25, 0);
    removeWater();
    if (waterGoal) await updateGoalProgress('water', newValue);
  };

  return (
    <div className="dash-card dash-card-glow !p-4 sm:!p-5">
      <div className="flex justify-between items-start mb-3 gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div
            className="dash-icon-badge dash-icon-badge--gradient-cyan flex-shrink-0"
            style={{ width: 36, height: 36 }}
          >
            <Droplets size={16} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-sm font-medium text-[#5f697a] truncate">
              Water Intake
            </p>
            <h3 className="text-lg sm:text-2xl font-heading font-bold text-[#0b1030]">
              {waterIntake.toFixed(1)}{' '}
              <span className="text-[10px] sm:text-sm font-normal text-[#6a7283]">/ 3 L</span>
            </h3>
          </div>
        </div>
        <button
          onClick={onSetReminder}
          className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
            reminderActive
              ? 'bg-blue-100 text-blue-600'
              : 'bg-[#f0f1fc] hover:bg-[#e8eaf9] text-[#5f697a]'
          }`}
          title={reminderActive ? 'Reminder Active' : 'Set Water Reminder'}
        >
          {reminderActive ? <BellRing size={16} /> : <Bell size={16} />}
        </button>
      </div>

      {/* Glass viz with gradient fills — responsive cell count per row */}
      <div className="grid grid-cols-6 gap-1 sm:gap-1.5 mb-2 sm:mb-3">
        {Array.from({ length: target }).map((_, i) => (
          <div
            key={i}
            className="h-5 sm:h-7 rounded-md transition-all"
            style={{
              background: i < glasses ? 'linear-gradient(180deg, #0ea5e9, #22d3ee)' : '#f0f1fc',
              boxShadow: i < glasses ? '0 2px 6px rgba(14, 165, 233, 0.25)' : 'none',
            }}
          />
        ))}
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] sm:text-xs text-[#5f697a] truncate">
          {remaining > 0 ? `${remaining} left · ${pct}%` : '🎉 Goal reached!'}
        </p>
        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
          <button
            onClick={handleRemoveGlass}
            disabled={waterIntake <= 0}
            className="p-1.5 sm:p-2 min-w-[32px] min-h-[32px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center rounded-lg bg-[#f0f1fc] hover:bg-[#e8eaf9] disabled:opacity-50 transition-colors"
            aria-label="Remove one glass of water"
          >
            <Minus size={12} className="text-[#5f697a]" />
          </button>
          <button
            onClick={handleAddGlass}
            disabled={waterIntake >= 3}
            className="p-1.5 sm:p-2 min-w-[32px] min-h-[32px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center rounded-lg bg-blue-100 hover:bg-blue-200 disabled:opacity-50 transition-colors"
            aria-label="Add one glass of water"
          >
            <Plus size={12} className="text-blue-600" />
          </button>
        </div>
      </div>

      {reminderActive && (
        <div className="mt-3 p-2 bg-blue-50 rounded-lg flex items-center gap-2 text-xs text-blue-700">
          <Volume2 size={14} />
          <span>Reminder every {reminderInterval} minutes</span>
        </div>
      )}
    </div>
  );
};

// ------------------------------------------------------------------
// Water Reminder Modal (unchanged)
// ------------------------------------------------------------------
const WaterReminderModal = ({ isOpen, onClose, onSave, currentInterval }) => {
  const [interval, setInterval] = useState(currentInterval || 30);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b1030]/50 backdrop-blur-sm">
      <div
        className="bg-white rounded-[20px] w-full max-w-sm p-6"
        style={{ boxShadow: '0 22px 38px rgba(11, 16, 48, 0.11)' }}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-heading font-bold text-[#0b1030] flex items-center gap-2">
            <Droplets className="text-blue-500" /> Water Reminder
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-[#f0f1fc] rounded-lg">
            <X size={20} className="text-[#5f697a]" />
          </button>
        </div>
        <p className="text-sm text-[#5f697a] mb-4">
          Set a reminder to drink water at regular intervals throughout the day.
        </p>
        <div className="mb-6">
          <label className="block text-sm font-medium text-[#0b1030] mb-2">Remind me every</label>
          <select
            value={interval}
            onChange={(e) => setInterval(Number(e.target.value))}
            className="dash-input"
          >
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
            <option value={60}>1 hour</option>
            <option value={90}>1.5 hours</option>
            <option value={120}>2 hours</option>
          </select>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={() => onSave(interval)}>
            <Bell size={16} className="mr-2" /> Set Reminder
          </Button>
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------
// Latest symptoms prediction card
// ------------------------------------------------------------------
const LatestSymptomsCard = ({ latest }) => {
  const navigate = useNavigate();
  return (
    <div className="dash-card dash-card-accent" style={{ '--accent-stripe': '#7c3aed' }}>
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="dash-icon-badge dash-icon-badge--gradient-violet">
            <Brain size={18} className="text-white" />
          </div>
          <h3 className="dash-heading text-sm sm:text-base">Latest Symptoms Prediction</h3>
        </div>
        {latest && typeof latest.confidence === 'number' && (
          <span className="dash-chip">
            <CheckCircle size={10} /> {Math.round(latest.confidence * 100)}% confidence
          </span>
        )}
      </div>

      {latest ? (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 p-3 bg-[#f0f1fc] rounded-xl">
            <span className="text-xs sm:text-sm text-[#5f697a]">Predicted Disease</span>
            <span className="font-bold text-[#0b1030] text-sm sm:text-base truncate">
              {latest.predictedDisease || 'N/A'}
            </span>
          </div>
          <div className="flex justify-between items-center gap-2 p-3 bg-[#f0f1fc] rounded-xl">
            <span className="text-xs sm:text-sm text-[#5f697a]">Selected Symptoms</span>
            <span className="font-bold text-[#0b1030]">
              {(latest.selectedSymptoms || []).length}
            </span>
          </div>
          <p className="text-sm text-[#5f697a] pt-1 line-clamp-3">
            {latest.details?.description ||
              'Latest symptoms prediction is available in your history.'}
          </p>
          <button
            type="button"
            onClick={() => navigate('/dashboard/prediction-history')}
            className="w-full flex items-center justify-center gap-1 text-xs font-semibold text-[#506cd7] hover:text-[#4753bf] py-2 rounded-lg bg-[#f0f1fc] hover:bg-[#e8eaf9] transition-colors"
          >
            View full details <ArrowRight size={12} />
          </button>
        </div>
      ) : (
        <div className="py-4">
          <p className="text-sm text-[#5f697a] mb-4">
            No symptoms prediction yet. Run your first check and track your history over time.
          </p>
          <Button size="sm" onClick={() => navigate('/dashboard/risk-prediction')}>
            Run first check
          </Button>
        </div>
      )}
    </div>
  );
};

// ------------------------------------------------------------------
// Dashboard page
// ------------------------------------------------------------------
const Dashboard = () => {
  const {
    dailySteps,
    stepsGoal,
    goalsCount,
    activeGoals,
    waterIntake,
    fetchHealthData,
    isInitialLoad,
  } = useHealthData();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [waterReminderActive, setWaterReminderActive] = useState(false);
  const [waterReminderInterval, setWaterReminderInterval] = useState(30);
  const [isWaterReminderModalOpen, setIsWaterReminderModalOpen] = useState(false);
  const [waterReminderTimerId, setWaterReminderTimerId] = useState(null);
  const [weatherSummary, setWeatherSummary] = useState({
    temperature: '--',
    condition: 'Loading weather...',
    location: 'Mumbai',
    activity: null,
  });
  const [symptomPredictions, setSymptomPredictions] = useState([]);
  const [heartDiabetesPredictions, setHeartDiabetesPredictions] = useState([]);
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [walkWeekly, setWalkWeekly] = useState([]);
  const latestSymptomPrediction = symptomPredictions[0] || null;

  const stepsProgress = Math.round((dailySteps / stepsGoal) * 100);
  const stepsFormatted = dailySteps.toLocaleString();
  const stepsGoalFormatted = (stepsGoal / 1000).toFixed(0) + 'k';

  // Build goal mini-bars for the Active Goals stat card
  const goalBars = useMemo(() => {
    const typeGradients = {
      water: 'linear-gradient(90deg, #0ea5e9, #22d3ee)',
      steps: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
      sleep: 'linear-gradient(90deg, #506cd7, #7c8bff)',
      weight: 'linear-gradient(90deg, #e74c4c, #fb7185)',
      custom: 'linear-gradient(90deg, #10b981, #34d399)',
    };
    return (activeGoals || [])
      .filter((g) => !g.isCompleted)
      .slice(0, 2)
      .map((g) => ({
        label: g.title,
        pct: g.target > 0 ? Math.min(Math.round((g.current / g.target) * 100), 100) : 0,
        gradient: typeGradients[g.type] || typeGradients.custom,
      }));
  }, [activeGoals]);

  // Steps sparkline data from walk-earn
  const stepsSparkline = useMemo(() => {
    if (!walkWeekly || walkWeekly.length === 0) return [];
    return walkWeekly.slice(-7).map((d) => d.steps || 0);
  }, [walkWeekly]);

  // Weather activity chip color
  const weatherChip = useMemo(() => {
    if (!weatherSummary.activity) return null;
    const suitabilityColors = {
      good: '#10b981',
      neutral: '#f59e0b',
      bad: '#e74c4c',
    };
    return {
      text: weatherSummary.activity.name || weatherSummary.condition,
      color: suitabilityColors[weatherSummary.activity.suitability] || '#0ea5e9',
    };
  }, [weatherSummary]);

  // -------- Notifications helpers --------
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };
  const showBrowserNotification = useCallback((title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        vibrate: [200, 100, 200],
      });
    }
  }, []);
  const createNotification = async (title, message, type = 'reminder') => {
    try {
      await axios.post(
        `${API_URL}/notifications`,
        { title, message, type },
        { withCredentials: true }
      );
    } catch (err) {
      /* silent */
    }
  };

  // -------- Data fetches --------
  const fetchWeatherSummary = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/forecast?city=mumbai`, {
        withCredentials: true,
      });
      const forecast = data?.forecast;
      if (!forecast) return;
      setWeatherSummary({
        temperature: String(forecast.temperature ?? '--'),
        condition: forecast.condition || 'Clear',
        location: forecast.location || 'Mumbai',
        activity:
          Array.isArray(forecast.activities) && forecast.activities.length > 0
            ? forecast.activities[0]
            : null,
      });
    } catch (err) {
      setWeatherSummary({
        temperature: '--',
        condition: 'Weather unavailable',
        location: 'Mumbai',
        activity: null,
      });
    }
  }, []);

  const fetchSymptomsPredictionHistory = useCallback(async () => {
    try {
      const response = await riskService.getSymptomsPredictionHistory(6);
      if (response.success) {
        setSymptomPredictions((response.predictions || []).slice(0, 6));
      }
    } catch {
      setSymptomPredictions([]);
    }
  }, []);

  const fetchHeartDiabetesPredictionHistory = useCallback(async () => {
    try {
      const response = await riskService.getRiskHistory();
      if (response.success) {
        const filtered = (response.predictions || []).filter(
          (item) =>
            typeof item?.results?.heartDiseaseRisk === 'number' ||
            typeof item?.results?.diabetesRisk === 'number'
        );
        setHeartDiabetesPredictions(filtered.slice(0, 6));
      }
    } catch {
      setHeartDiabetesPredictions([]);
    }
  }, []);

  const fetchDashboardSummary = useCallback(async () => {
    try {
      const response = await dashboardService.getSummary();
      if (response?.success) setDashboardSummary(response.data);
    } catch {
      setDashboardSummary(null);
    }
  }, []);

  const fetchWalkSummary = useCallback(async () => {
    try {
      const response = await walkEarnService.getSummary();
      if (response?.weeklyData) setWalkWeekly(response.weeklyData);
    } catch {
      setWalkWeekly([]);
    }
  }, []);

  // -------- Water reminder lifecycle (kept from original) --------
  const startWaterReminder = (intervalMinutes) => {
    if (waterReminderTimerId) clearInterval(waterReminderTimerId);
    setWaterReminderInterval(intervalMinutes);
    setWaterReminderActive(true);
    setIsWaterReminderModalOpen(false);
    createNotification(
      '💧 Water Reminder Set',
      `You'll be reminded every ${intervalMinutes} minutes`,
      'reminder'
    );
    const timerId = setInterval(
      () => {
        createNotification(
          '💧 Time to Hydrate!',
          'Drink a glass of water to stay healthy and focused.',
          'reminder'
        );
        showBrowserNotification('💧 Water Reminder', 'Time to drink water!');
      },
      intervalMinutes * 60 * 1000
    );
    setWaterReminderTimerId(timerId);
    localStorage.setItem('waterReminderActive', 'true');
    localStorage.setItem('waterReminderInterval', String(intervalMinutes));
  };
  const stopWaterReminder = () => {
    if (waterReminderTimerId) clearInterval(waterReminderTimerId);
    setWaterReminderActive(false);
    setWaterReminderTimerId(null);
    localStorage.removeItem('waterReminderActive');
    localStorage.removeItem('waterReminderInterval');
  };

  // -------- Water milestone notifications --------
  useEffect(() => {
    const glasses = Math.floor(waterIntake * 4);
    const milestones = [4, 8, 12];
    milestones.forEach((m) => {
      if (glasses === m) {
        const liters = m / 4;
        createNotification(
          '🎉 Water Goal Progress!',
          `Great job! You've reached ${liters}L of water intake today.`,
          'achievement'
        );
        showBrowserNotification('🎉 Water Goal', `You've drunk ${liters}L today!`);
      }
    });
  }, [waterIntake]);

  // -------- Init --------
  useEffect(() => {
    requestNotificationPermission();
    fetchHealthData();
    fetchWeatherSummary();
    fetchSymptomsPredictionHistory();
    fetchHeartDiabetesPredictionHistory();
    fetchDashboardSummary();
    fetchWalkSummary();

    const savedActive = localStorage.getItem('waterReminderActive');
    const savedInterval = localStorage.getItem('waterReminderInterval');
    if (savedActive === 'true' && savedInterval) {
      startWaterReminder(Number(savedInterval));
    }
    return () => {
      if (waterReminderTimerId) clearInterval(waterReminderTimerId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =============================================================
  // Render
  // =============================================================

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Hero */}
      {isInitialLoad || !dashboardSummary ? (
        <SkeletonHero />
      ) : (
        <DashReveal delay={0}>
          <HealthScoreHero summary={dashboardSummary} userName={user?.name} />
        </DashReveal>
      )}

      {/* 2. Quick Actions */}
      {isInitialLoad ? (
        <SkeletonQuickActions />
      ) : (
        <DashReveal delay={0.06}>
          <QuickActionsBar />
        </DashReveal>
      )}

      {/* 3. Stat Row */}
      {isInitialLoad ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-6">
          {[
            <EnhancedStatCard
              key="steps"
              title="Daily Steps"
              value={stepsFormatted}
              unit={`/ ${stepsGoalFormatted}`}
              icon={Footprints}
              iconClass="dash-icon-badge--gradient-amber"
              subtext={`${stepsProgress}% of daily goal`}
              sparklineData={stepsSparkline}
              trendPct={stepsSparkline.length >= 2 ? estimateTrendPct(stepsSparkline) : null}
            />,
            <WaterTracker
              key="water"
              onSetReminder={() =>
                waterReminderActive ? stopWaterReminder() : setIsWaterReminderModalOpen(true)
              }
              reminderActive={waterReminderActive}
              reminderInterval={waterReminderInterval}
            />,
            <EnhancedStatCard
              key="goals"
              title="Active Goals"
              value={goalsCount.toString()}
              unit="ongoing"
              icon={Target}
              iconClass="dash-icon-badge--gradient-emerald"
              subtext={goalBars.length === 0 ? 'Track your progress' : undefined}
              progressBars={goalBars}
              onAction={goalsCount === 0 ? () => navigate('/dashboard/reverse-planner') : undefined}
              actionLabel={goalsCount === 0 ? 'Add a goal' : undefined}
            />,
            <EnhancedStatCard
              key="weather"
              title="Weather"
              value={weatherSummary.temperature}
              unit="°C"
              icon={CloudSun}
              iconClass="dash-icon-badge--gradient-indigo"
              subtext={`${weatherSummary.condition} · ${weatherSummary.location}`}
              activityChip={weatherChip}
            />,
          ].map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              {card}
            </motion.div>
          ))}
        </div>
      )}

      {/* 4 + 5. Trends Chart + Today's Focus */}
      {isInitialLoad ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          <SkeletonChart />
          <SkeletonRiskCard />
        </div>
      ) : (
        <DashReveal
          delay={0.12}
          className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6"
        >
          <div className="lg:col-span-2">
            <WeeklyTrendsChart />
          </div>
          <TodayFocusCard />
        </DashReveal>
      )}

      {/* 6 + 7. Latest Symptoms + Smart Insights */}
      {isInitialLoad ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
          <SkeletonRiskCard />
          <SkeletonRiskCard />
        </div>
      ) : (
        <DashReveal
          delay={0.18}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 lg:gap-6"
        >
          <LatestSymptomsCard latest={latestSymptomPrediction} />
          <SmartInsightsCard />
        </DashReveal>
      )}

      {/* 8. Recent Activity (unified) */}
      {!isInitialLoad && (
        <DashReveal delay={0.24}>
          <RecentPredictionsCard
            symptomPredictions={symptomPredictions}
            riskPredictions={heartDiabetesPredictions}
          />
        </DashReveal>
      )}

      {/* Modal */}
      <WaterReminderModal
        isOpen={isWaterReminderModalOpen}
        onClose={() => setIsWaterReminderModalOpen(false)}
        onSave={startWaterReminder}
        currentInterval={waterReminderInterval}
      />
    </div>
  );
};

const estimateTrendPct = (arr) => {
  if (!arr || arr.length < 2) return null;
  const first = arr.slice(0, Math.max(1, Math.floor(arr.length / 2)));
  const last = arr.slice(Math.floor(arr.length / 2));
  const avg = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const a = avg(first);
  const b = avg(last);
  if (!a) return null;
  return Math.round(((b - a) / a) * 100);
};

export default Dashboard;
