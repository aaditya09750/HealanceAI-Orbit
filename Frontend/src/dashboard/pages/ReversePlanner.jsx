import React, { useState, useEffect } from 'react';
import {
  Target,
  Droplets,
  Flame,
  Moon,
  Footprints,
  Plus,
  Edit2,
  Trash2,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  TrendingUp,
  Calendar,
  Sparkles,
} from 'lucide-react';
import Button from '../../shared/ui/Button';
import ConfirmDialog from '../../shared/ui/ConfirmDialog';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { useHealthData } from '../../context/HealthDataContext';
import { useToast } from '../../context/ToastContext';
import { API_URL } from '../../constants/config';

const goalIcons = {
  steps: Footprints,
  water: Droplets,
  calories: Flame,
  sleep: Moon,
  weight: Target,
  custom: Target,
};

const goalColors = {
  steps: 'bg-orange-500',
  water: 'bg-blue-500',
  calories: 'bg-red-500',
  sleep: 'bg-purple-500',
  weight: 'bg-green-500',
  custom: 'bg-primary-500',
};

// Gradient classes for the dashboard visual language
const goalBadgeClasses = {
  steps: 'dash-icon-badge--gradient-amber',
  water: 'dash-icon-badge--gradient-cyan',
  calories: 'dash-icon-badge--gradient-rose',
  sleep: 'dash-icon-badge--gradient-indigo',
  weight: 'dash-icon-badge--gradient-emerald',
  custom: 'dash-icon-badge--gradient-violet',
};

const goalBarGradients = {
  steps: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
  water: 'linear-gradient(90deg, #0ea5e9, #22d3ee)',
  calories: 'linear-gradient(90deg, #e74c4c, #fb7185)',
  sleep: 'linear-gradient(90deg, #506cd7, #7c8bff)',
  weight: 'linear-gradient(90deg, #10b981, #34d399)',
  custom: 'linear-gradient(90deg, #7c3aed, #a78bfa)',
};

const defaultGoalUnits = {
  steps: 'steps',
  water: 'L',
  calories: 'kcal',
  sleep: 'hrs',
  weight: 'kg',
  custom: '',
};

const GoalCard = ({ goal, onEdit, onDelete, onLogProgress }) => {
  const Icon = goalIcons[goal.type] || Target;
  const badgeClass = goalBadgeClasses[goal.type] || 'dash-icon-badge--gradient-indigo';
  const barGradient = goalBarGradients[goal.type] || 'linear-gradient(90deg, #506cd7, #7c8bff)';
  const progress = Math.min(Math.round((goal.current / goal.target) * 100), 100);
  const remaining = Math.max(goal.target - goal.current, 0);
  const daysLeft = goal.endDate
    ? Math.ceil((new Date(goal.endDate) - new Date()) / (1000 * 60 * 60 * 24))
    : 7;
  const dailyNeeded = daysLeft > 0 ? Math.round(remaining / daysLeft) : 0;

  return (
    <div className="dash-card dash-card-glow relative group">
      {/* Action Buttons */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(goal)}
          className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-[#f0f1fc] rounded-lg transition-colors"
          aria-label="Edit goal"
        >
          <Edit2 size={14} className="text-[#5f697a]" />
        </button>
        <button
          onClick={() => onDelete(goal._id)}
          className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-red-50 rounded-lg transition-colors"
          aria-label="Delete goal"
        >
          <Trash2 size={14} className="text-red-500" />
        </button>
      </div>

      <div className="flex justify-between items-start mb-2 sm:mb-4">
        <div className={`dash-icon-badge ${badgeClass}`}>
          <Icon size={20} className="text-white" />
        </div>
        <span
          className={`text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full ${
            progress >= 100
              ? 'bg-emerald-100 text-emerald-700'
              : progress >= 50
                ? 'bg-blue-100 text-blue-700'
                : 'bg-slate-100 text-slate-700'
          }`}
        >
          {progress}%
        </span>
      </div>

      <h3 className="font-bold text-sm sm:text-base text-[#0b1030] mb-1 truncate">{goal.title}</h3>
      <div className="flex items-end gap-1 mb-2 sm:mb-3">
        <span className="text-lg sm:text-2xl font-heading font-bold text-[#0b1030]">
          {goal.current}
        </span>
        <span className="text-[10px] sm:text-sm text-[#5f697a] mb-0.5 sm:mb-1">
          / {goal.target} {goal.unit}
        </span>
      </div>

      <div className="w-full bg-[#f0f1fc] h-1.5 sm:h-2 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${progress}%`, background: barGradient }}
        />
      </div>

      <div className="flex justify-between items-center mt-2 sm:mt-3">
        <p className="text-[8px] sm:text-xs text-[#5f697a] flex items-center">
          <Target size={10} className="mr-1 flex-shrink-0 sm:w-3 sm:h-3" />
          {dailyNeeded > 0 ? `${dailyNeeded} ${goal.unit}/day needed` : 'Goal reached!'}
        </p>
        <button
          onClick={() => onLogProgress(goal)}
          className="text-[10px] sm:text-xs font-medium text-[#506cd7] hover:text-[#4753bf]"
        >
          + Log
        </button>
      </div>
    </div>
  );
};

// Goal Modal Component
const GoalModal = ({ isOpen, onClose, goal, onSave, isLoading }) => {
  const [formData, setFormData] = useState({
    type: 'steps',
    title: '',
    current: 0,
    target: 10000,
    unit: 'steps',
    endDate: '',
  });

  useEffect(() => {
    if (goal) {
      setFormData({
        type: goal.type,
        title: goal.title,
        current: goal.current,
        target: goal.target,
        unit: goal.unit,
        endDate: goal.endDate ? new Date(goal.endDate).toISOString().split('T')[0] : '',
      });
    } else {
      setFormData({
        type: 'steps',
        title: 'Daily Steps',
        current: 0,
        target: 10000,
        unit: 'steps',
        endDate: '',
      });
    }
  }, [goal, isOpen]);

  const handleTypeChange = (type) => {
    const titles = {
      steps: 'Daily Steps',
      water: 'Water Intake',
      calories: 'Calories Burned',
      sleep: 'Sleep Duration',
      weight: 'Target Weight',
      custom: '',
    };
    const targets = {
      steps: 10000,
      water: 3,
      calories: 2200,
      sleep: 8,
      weight: 70,
      custom: 100,
    };
    setFormData({
      ...formData,
      type,
      title: goal ? formData.title : titles[type],
      target: goal ? formData.target : targets[type],
      unit: defaultGoalUnits[type],
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData, goal?._id);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b1030]/50 backdrop-blur-sm">
      <div
        className="bg-white rounded-[20px] w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar-hide"
        style={{ boxShadow: '0 22px 38px rgba(11, 16, 48, 0.11)' }}
      >
        <div className="sticky top-0 bg-white border-b border-[#e8eaf9] p-4 flex justify-between items-center">
          <h3 className="text-lg font-heading font-bold text-[#0b1030]">
            {goal ? 'Edit Goal' : 'Create New Goal'}
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-[#f0f1fc] rounded-lg">
            <X size={20} className="text-[#5f697a]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Goal Type */}
          <div>
            <label className="block text-sm font-medium text-[#0b1030] mb-2">Goal Type</label>
            <div className="grid grid-cols-3 gap-2">
              {['steps', 'water', 'calories', 'sleep', 'weight', 'custom'].map((type) => {
                const Icon = goalIcons[type];
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleTypeChange(type)}
                    className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${
                      formData.type === type
                        ? 'border-[#506cd7] bg-[#f0f1fc]'
                        : 'border-[#e8eaf9] hover:border-[#506cd7]/40'
                    }`}
                  >
                    <Icon
                      size={20}
                      className={formData.type === type ? 'text-[#506cd7]' : 'text-[#5f697a]'}
                    />
                    <span className="text-xs capitalize">{type}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-[#0b1030] mb-2">Goal Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="dash-input"
              placeholder="Enter goal title"
              required
            />
          </div>

          {/* Current & Target */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#0b1030] mb-2">Current</label>
              <input
                type="number"
                value={formData.current}
                onChange={(e) =>
                  setFormData({ ...formData, current: parseFloat(e.target.value) || 0 })
                }
                className="dash-input"
                min="0"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0b1030] mb-2">Target</label>
              <input
                type="number"
                value={formData.target}
                onChange={(e) =>
                  setFormData({ ...formData, target: parseFloat(e.target.value) || 0 })
                }
                className="dash-input"
                min="1"
                step="0.1"
                required
              />
            </div>
          </div>

          {/* Unit */}
          <div>
            <label className="block text-sm font-medium text-[#0b1030] mb-2">Unit</label>
            <input
              type="text"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="dash-input"
              placeholder="e.g., steps, L, kcal"
              required
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-[#0b1030] mb-2">
              Target Date (Optional)
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="dash-input"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 size={18} className="mr-2 animate-spin" /> Saving...
              </>
            ) : (
              <>{goal ? 'Update Goal' : 'Create Goal'}</>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

// Log Progress Modal
const LogProgressModal = ({ isOpen, onClose, goal, onSave, isLoading }) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (goal) setValue(goal.current);
  }, [goal, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(goal._id, value);
  };

  if (!isOpen || !goal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b1030]/50 backdrop-blur-sm">
      <div
        className="bg-white rounded-[20px] w-full max-w-sm p-6"
        style={{ boxShadow: '0 22px 38px rgba(11, 16, 48, 0.11)' }}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-heading font-bold text-[#0b1030]">Log Progress</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-[#f0f1fc] rounded-lg">
            <X size={20} className="text-[#5f697a]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#0b1030] mb-2">{goal.title}</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
                className="dash-input flex-1 text-lg font-bold text-center"
                step="0.1"
                required
              />
              <span className="text-[#5f697a] font-medium">{goal.unit}</span>
            </div>
            <p className="text-xs text-[#5f697a] mt-2 text-center">
              Target: {goal.target} {goal.unit}
            </p>
          </div>

          {/* Quick Add Buttons */}
          <div className="flex gap-2 justify-center">
            {[10, 50, 100, 500].map((increment) => (
              <button
                key={increment}
                type="button"
                onClick={() => setValue((prev) => prev + increment)}
                className="px-3 py-1.5 bg-[#f0f1fc] hover:bg-[#e8eaf9] rounded-lg text-sm font-medium text-[#0b1030] transition-colors"
              >
                +{increment}
              </button>
            ))}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 size={18} className="mr-2 animate-spin" /> Saving...
              </>
            ) : (
              'Save Progress'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

const ReversePlanner = () => {
  const { fetchHealthData } = useHealthData();
  const { toast } = useToast();

  const [goals, setGoals] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Modals
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [goalToDelete, setGoalToDelete] = useState(null);

  // Fetch goals
  const fetchGoals = async () => {
    try {
      const response = await axios.get(`${API_URL}/goals`, { withCredentials: true });
      if (response.data.success) {
        setGoals(response.data.goals);
      }
    } catch (err) {
      toast({ title: 'Failed to load goals', variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch AI suggestions
  const fetchSuggestions = async () => {
    try {
      const response = await axios.get(`${API_URL}/goals/suggestions`, { withCredentials: true });
      if (response.data.success) {
        setSuggestions(response.data.suggestions);
      }
    } catch (err) {
      // Generate default suggestions based on goals
      generateLocalSuggestions();
    }
  };

  // Generate suggestions locally if API fails
  const generateLocalSuggestions = () => {
    const localSuggestions = [];
    goals.forEach((goal) => {
      const progress = (goal.current / goal.target) * 100;
      if (progress < 50) {
        localSuggestions.push({
          text: `Increase your ${goal.title.toLowerCase()} by ${Math.round((goal.target - goal.current) / 2)} ${goal.unit}`,
          priority: 'high',
        });
      } else if (progress < 80) {
        localSuggestions.push({
          text: `You're close! ${Math.round(goal.target - goal.current)} ${goal.unit} more to reach your ${goal.title.toLowerCase()} goal`,
          priority: 'medium',
        });
      }
    });

    if (localSuggestions.length === 0) {
      localSuggestions.push(
        { text: 'Great progress! Keep maintaining your current routine', priority: 'low' },
        { text: 'Consider setting a new challenging goal', priority: 'low' }
      );
    }

    setSuggestions(localSuggestions.slice(0, 4));
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  useEffect(() => {
    if (goals.length > 0) {
      fetchSuggestions();
    }
  }, [goals]);

  // Create/Update goal
  const handleSaveGoal = async (data, goalId) => {
    setIsSaving(true);
    try {
      let response;
      const payload = {
        ...data,
        current: Number(data.current) || 0,
        target: Number(data.target) || 0,
        endDate: data.endDate || undefined,
      };

      if (goalId) {
        response = await axios.put(`${API_URL}/goals/${goalId}`, payload, {
          withCredentials: true,
        });
      } else {
        response = await axios.post(`${API_URL}/goals`, payload, { withCredentials: true });
      }

      if (response.data.success) {
        toast({ title: goalId ? 'Goal updated' : 'Goal created', variant: 'success' });
        fetchGoals();
        fetchHealthData();
        setIsGoalModalOpen(false);
        setSelectedGoal(null);
      }
    } catch (err) {
      toast({ title: err.response?.data?.message || 'Failed to save goal', variant: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete goal
  const handleDeleteGoal = (goalId) => setGoalToDelete(goalId);

  const confirmDeleteGoal = async () => {
    if (!goalToDelete) return;
    try {
      await axios.delete(`${API_URL}/goals/${goalToDelete}`, { withCredentials: true });
      toast({ title: 'Goal deleted', variant: 'success' });
      fetchGoals();
      fetchHealthData();
    } catch (err) {
      toast({ title: 'Failed to delete goal', variant: 'error' });
    } finally {
      setGoalToDelete(null);
    }
  };

  // Log progress
  const handleLogProgress = async (goalId, value) => {
    setIsSaving(true);
    try {
      const response = await axios.post(
        `${API_URL}/goals/${goalId}/progress`,
        { value },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast({ title: 'Progress logged', variant: 'success' });
        fetchGoals();
        fetchHealthData();
        setIsLogModalOpen(false);
        setSelectedGoal(null);
      }
    } catch (err) {
      toast({ title: 'Failed to log progress', variant: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate weekly data for chart
  const getWeeklyData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date().getDay();

    // Create ordered days starting from today - 6
    const orderedDays = [];
    for (let i = 6; i >= 0; i--) {
      orderedDays.push(days[(today - i + 7) % 7]);
    }

    // Calculate average progress for each day
    return orderedDays.map((day) => {
      let totalProgress = 0;
      let count = 0;

      goals.forEach((goal) => {
        const dayData = goal.weeklyProgress?.find((p) => p.day === day);
        if (dayData) {
          totalProgress += (dayData.value / goal.target) * 100;
          count++;
        } else if (day === days[today]) {
          // Today's progress
          totalProgress += (goal.current / goal.target) * 100;
          count++;
        }
      });

      return {
        name: day,
        progress: count > 0 ? Math.min(Math.round(totalProgress / count), 100) : 0,
      };
    });
  };

  // Calculate estimated completion
  const getEstimatedCompletion = () => {
    if (goals.length === 0) return null;

    const activeGoals = goals.filter((g) => !g.isCompleted);
    if (activeGoals.length === 0) return { date: 'Completed!', progress: 100 };

    let totalProgress = 0;
    let avgDailyProgress = 0;

    activeGoals.forEach((goal) => {
      totalProgress += (goal.current / goal.target) * 100;
      // Estimate daily progress based on current/days since start
      const daysSinceStart = Math.max(
        1,
        Math.ceil((new Date() - new Date(goal.startDate)) / (1000 * 60 * 60 * 24))
      );
      avgDailyProgress += (goal.current / daysSinceStart / goal.target) * 100;
    });

    totalProgress = Math.round(totalProgress / activeGoals.length);
    avgDailyProgress = avgDailyProgress / activeGoals.length;

    if (avgDailyProgress <= 0) avgDailyProgress = 1;

    const daysToComplete = Math.ceil((100 - totalProgress) / avgDailyProgress);
    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + daysToComplete);

    return {
      date: completionDate.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      progress: totalProgress,
    };
  };

  const weeklyData = getWeeklyData();
  const estimatedCompletion = getEstimatedCompletion();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={40} className="animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div className="flex items-start gap-3">
          <div className="dash-icon-badge dash-icon-badge--gradient-emerald hidden sm:inline-flex">
            <Target size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-heading font-bold text-[#0b1030]">
              <span className="dash-gradient-text">Reverse Health Planner</span>
            </h2>
            <p className="text-sm sm:text-base text-[#5f697a] mt-1">
              Set your goals and let AI guide you backwards to achieve them.
            </p>
          </div>
        </div>
        <Button
          className="w-full sm:w-auto"
          onClick={() => {
            setSelectedGoal(null);
            setIsGoalModalOpen(true);
          }}
        >
          <Plus size={18} className="mr-2" /> Add Goal
        </Button>
      </div>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!goalToDelete}
        title="Delete this goal?"
        description="This action cannot be undone. All progress data for this goal will be lost."
        confirmLabel="Delete Goal"
        variant="danger"
        onConfirm={confirmDeleteGoal}
        onClose={() => setGoalToDelete(null)}
      />

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="dash-card-static text-center !p-8">
          <Target size={48} className="mx-auto text-[#e8eaf9] mb-4" />
          <h3 className="text-lg font-heading font-bold text-[#0b1030] mb-2">No goals yet</h3>
          <p className="text-[#5f697a] mb-4">
            Create your first health goal to start tracking your progress.
          </p>
          <Button onClick={() => setIsGoalModalOpen(true)}>
            <Plus size={18} className="mr-2" /> Create First Goal
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {goals.map((goal) => (
            <GoalCard
              key={goal._id}
              goal={goal}
              onEdit={(g) => {
                setSelectedGoal(g);
                setIsGoalModalOpen(true);
              }}
              onDelete={handleDeleteGoal}
              onLogProgress={(g) => {
                setSelectedGoal(g);
                setIsLogModalOpen(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Charts & Suggestions */}
      {goals.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Weekly Chart */}
          <div
            className="lg:col-span-2 dash-card-static dash-card-accent"
            style={{ '--accent-stripe': '#506cd7' }}
          >
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <div className="dash-icon-badge dash-icon-badge--gradient-indigo">
                <TrendingUp size={20} className="text-white" />
              </div>
              <h3 className="dash-heading text-sm sm:text-base">Weekly Goal Completion</h3>
            </div>
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%" minHeight={192}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{
                      borderRadius: '16px',
                      border: '1px solid rgba(80, 108, 215, 0.12)',
                      boxShadow: '0 10px 35px rgba(2, 6, 23, 0.08)',
                    }}
                    formatter={(value) => [`${value}%`, 'Progress']}
                  />
                  <Bar
                    dataKey="progress"
                    fill="url(#plannerBarGrad)"
                    radius={[6, 6, 0, 0]}
                    barSize={40}
                  />
                  <defs>
                    <linearGradient id="plannerBarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#506cd7" />
                      <stop offset="100%" stopColor="#0ea5e9" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Suggestions */}
          <div
            className="dash-card-static dash-card-accent"
            style={{ '--accent-stripe': '#f59e0b' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="dash-icon-badge dash-icon-badge--gradient-amber">
                <Sparkles size={20} className="text-white" />
              </div>
              <h3 className="dash-heading text-sm sm:text-base">AI Suggestions</h3>
            </div>
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => {
                const priorityStyle =
                  suggestion.priority === 'high'
                    ? { badge: 'bg-rose-100 text-rose-700', icon: 'text-rose-500', label: 'High' }
                    : suggestion.priority === 'medium'
                      ? {
                          badge: 'bg-amber-100 text-amber-700',
                          icon: 'text-amber-500',
                          label: 'Medium',
                        }
                      : {
                          badge: 'bg-emerald-100 text-emerald-700',
                          icon: 'text-emerald-500',
                          label: 'Low',
                        };
                return (
                  <div
                    key={index}
                    className="flex gap-3 p-2.5 rounded-lg hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      <CheckCircle size={16} className={priorityStyle.icon} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${priorityStyle.badge}`}
                        >
                          {priorityStyle.label}
                        </span>
                      </div>
                      <p className="text-sm text-[#5f697a] leading-snug">{suggestion.text}</p>
                    </div>
                  </div>
                );
              })}

              {suggestions.length === 0 && (
                <p className="text-sm text-[#5f697a] text-center py-4">
                  Complete some progress to get personalized suggestions!
                </p>
              )}
            </div>

            {/* Estimated Completion */}
            {estimatedCompletion && (
              <div className="mt-6 pt-6 border-t border-[#e8eaf9]">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="dash-icon-badge dash-icon-badge--gradient-indigo"
                    style={{ width: 28, height: 28 }}
                  >
                    <Calendar size={13} className="text-white" />
                  </span>
                  <span className="text-sm text-[#5f697a]">Estimated Completion</span>
                </div>
                <span className="text-lg font-heading font-bold dash-gradient-text">
                  {estimatedCompletion.date}
                </span>
                <div className="w-full bg-[#f0f1fc] h-2 rounded-full mt-3 overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${estimatedCompletion.progress}%`,
                      background: 'linear-gradient(90deg, #506cd7, #0ea5e9)',
                    }}
                  />
                </div>
                <p className="text-xs text-[#5f697a] mt-2">
                  Overall progress: {estimatedCompletion.progress}%
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => {
          setIsGoalModalOpen(false);
          setSelectedGoal(null);
        }}
        goal={selectedGoal}
        onSave={handleSaveGoal}
        isLoading={isSaving}
      />

      <LogProgressModal
        isOpen={isLogModalOpen}
        onClose={() => {
          setIsLogModalOpen(false);
          setSelectedGoal(null);
        }}
        goal={selectedGoal}
        onSave={handleLogProgress}
        isLoading={isSaving}
      />
    </div>
  );
};

export default ReversePlanner;
