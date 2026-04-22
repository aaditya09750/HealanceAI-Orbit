import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../constants/config';

const HealthDataContext = createContext();

export const useHealthData = () => {
  const context = useContext(HealthDataContext);
  if (!context) {
    throw new Error('useHealthData must be used within HealthDataProvider');
  }
  return context;
};

export const HealthDataProvider = ({ children }) => {
  // Water Intake State
  const [waterIntake, setWaterIntake] = useState(() => {
    const saved = localStorage.getItem('healance_water_intake');
    return saved ? parseFloat(saved) : 0;
  });

  // Daily Steps State
  const [dailySteps, setDailySteps] = useState(0);
  const [stepsGoal] = useState(10000);

  // Goals State
  const [activeGoals, setActiveGoals] = useState([]);
  const [goalsCount, setGoalsCount] = useState(0);

  // Walk & Earn Coins
  const [coins, setCoins] = useState(0);

  // Fetch state to prevent multiple simultaneous calls
  const [isFetching, setIsFetching] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Update water intake in localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('healance_water_intake', waterIntake.toString());
  }, [waterIntake]);

  // Add water (in liters, 0.25L = 1 glass)
  const addWater = (amount = 0.25) => {
    setWaterIntake((prev) => Math.min(prev + amount, 3));
  };

  // Remove water
  const removeWater = (amount = 0.25) => {
    setWaterIntake((prev) => Math.max(prev - amount, 0));
  };

  // Fetch all health data from backend
  const fetchHealthData = async () => {
    // Prevent multiple simultaneous fetches
    if (isFetching) return;

    try {
      setIsFetching(true);

      // Fetch goals
      const goalsResponse = await axios.get(`${API_URL}/goals`, { withCredentials: true });

      if (goalsResponse.data.success) {
        const goals = goalsResponse.data.goals;
        setActiveGoals(goals);
        setGoalsCount(goals.filter((g) => !g.isCompleted).length);

        // Get water goal if exists
        const waterGoal = goals.find((g) => g.type === 'water');
        if (waterGoal) {
          setWaterIntake(waterGoal.current);
        }

        // Get steps goal if exists
        const stepsGoal = goals.find((g) => g.type === 'steps');
        if (stepsGoal) {
          setDailySteps(stepsGoal.current);
        }
      }

      // Fetch walk & earn data
      try {
        const walkEarnResponse = await axios.get(`${API_URL}/walk-earn/summary`, {
          withCredentials: true,
        });
        if (walkEarnResponse.data.success) {
          setCoins(walkEarnResponse.data.totalCoins || 0);
        }
      } catch (err) {
        console.log('Walk & Earn data not available');
      }
    } catch (err) {
      console.error('Failed to fetch health data:', err);
    } finally {
      setIsFetching(false);
      setIsInitialLoad(false);
    }
  };

  // Update goal progress in backend
  const updateGoalProgress = async (goalType, value) => {
    try {
      const goal = activeGoals.find((g) => g.type === goalType);
      if (goal) {
        await axios.post(
          `${API_URL}/goals/${goal._id}/progress`,
          { value },
          { withCredentials: true }
        );

        // Update local state
        if (goalType === 'water') {
          setWaterIntake(value);
        } else if (goalType === 'steps') {
          setDailySteps(value);
        }

        // Refresh goals data
        fetchHealthData();
      }
    } catch (err) {
      console.error('Failed to update goal progress:', err);
    }
  };

  // Initialize data on mount
  useEffect(() => {
    fetchHealthData();

    // Reset water intake at midnight
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const msUntilMidnight = tomorrow - now;

    const midnightTimer = setTimeout(() => {
      setWaterIntake(0);
      localStorage.setItem('healance_water_intake', '0');

      // Set up daily reset
      setInterval(
        () => {
          setWaterIntake(0);
          localStorage.setItem('healance_water_intake', '0');
        },
        24 * 60 * 60 * 1000
      );
    }, msUntilMidnight);

    return () => clearTimeout(midnightTimer);
  }, []);

  const value = {
    // Water
    waterIntake,
    setWaterIntake,
    addWater,
    removeWater,

    // Steps
    dailySteps,
    setDailySteps,
    stepsGoal,

    // Goals
    activeGoals,
    goalsCount,

    // Coins
    coins,
    setCoins,

    // State
    isFetching,
    isInitialLoad,

    // Functions
    fetchHealthData,
    updateGoalProgress,
  };

  return <HealthDataContext.Provider value={value}>{children}</HealthDataContext.Provider>;
};
