import Goal from '../models/Goal.js';
import { createSystemNotification } from './notificationController.js';

// @desc    Create a new goal
// @route   POST /api/goals
// @access  Private
export const createGoal = async (req, res) => {
  try {
    const goal = await Goal.create({
      user: req.user._id,
      ...req.body,
    });

    // Create notification for new goal
    await createSystemNotification(
      req.user._id,
      '🎯 New Goal Created!',
      `Your new goal "${goal.title}" has been set. Let's achieve it together!`,
      'health'
    );

    res.status(201).json({ success: true, goal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all goals for user
// @route   GET /api/goals
// @access  Private
export const getGoals = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { user: req.user._id };
    if (status === 'active') filter.isCompleted = false;
    if (status === 'completed') filter.isCompleted = true;

    const goals = await Goal.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, goals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update goal progress
// @route   PUT /api/goals/:id
// @access  Private
export const updateGoal = async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    const wasCompleted = goal.isCompleted;
    const { current, target, isCompleted } = req.body;
    if (current !== undefined) goal.current = current;
    if (target !== undefined) goal.target = target;
    if (isCompleted !== undefined) goal.isCompleted = isCompleted;

    // Check if goal is completed
    if (goal.current >= goal.target && !wasCompleted) {
      goal.isCompleted = true;
      // Create achievement notification
      await createSystemNotification(
        req.user._id,
        '🎯 Goal Completed!',
        `Congratulations! You've achieved your "${goal.title}" goal!`,
        'achievement'
      );
    }

    const updatedGoal = await goal.save();
    res.json({ success: true, goal: updatedGoal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Log daily progress for a goal
// @route   POST /api/goals/:id/progress
// @access  Private
export const logProgress = async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const previousProgress = (goal.current / goal.target) * 100;

    goal.weeklyProgress.push({
      day: dayNames[today.getDay()],
      value: req.body.value,
      date: today,
    });

    // Keep only last 7 entries
    if (goal.weeklyProgress.length > 7) {
      goal.weeklyProgress = goal.weeklyProgress.slice(-7);
    }

    // Update current value
    goal.current = req.body.value;
    const newProgress = (goal.current / goal.target) * 100;

    // Check for milestone notifications (25%, 50%, 75%, 100%)
    const milestones = [25, 50, 75, 100];
    for (const milestone of milestones) {
      if (previousProgress < milestone && newProgress >= milestone) {
        if (milestone === 100) {
          goal.isCompleted = true;
          await createSystemNotification(
            req.user._id,
            '🎯 Goal Completed!',
            `Amazing! You've completed your "${goal.title}" goal!`,
            'achievement'
          );
        } else {
          await createSystemNotification(
            req.user._id,
            `📈 ${milestone}% Progress!`,
            `Great work! You're ${milestone}% of the way to your "${goal.title}" goal.`,
            'health'
          );
        }
        break;
      }
    }

    await goal.save();
    res.json({ success: true, goal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a goal
// @route   DELETE /api/goals/:id
// @access  Private
export const deleteGoal = async (req, res) => {
  try {
    await Goal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ success: true, message: 'Goal deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get AI suggestions for goals
// @route   GET /api/goals/suggestions
// @access  Private
export const getAISuggestions = async (req, res) => {
  try {
    const goals = await Goal.find({ user: req.user._id, isCompleted: false });

    const suggestions = [];

    goals.forEach((goal) => {
      const progress = goal.target > 0 ? (goal.current / goal.target) * 100 : 0;
      const remaining = goal.target - goal.current;

      if (goal.type === 'water' && progress < 50) {
        suggestions.push({
          text: `Increase water intake by ${(remaining / 2).toFixed(1)}L`,
          detail: 'Based on your activity level today.',
          priority: 'high',
        });
      }
      if (goal.type === 'steps' && progress < 70) {
        suggestions.push({
          text: `Walk ${remaining} more steps`,
          detail: 'To reach your weekly average.',
          priority: 'medium',
        });
      }
      if (goal.type === 'sleep' && progress < 80) {
        suggestions.push({
          text: `Sleep by 10:30 PM`,
          detail: `To ensure ${goal.target} hours of rest.`,
          priority: 'medium',
        });
      }
      if (goal.type === 'calories' && progress < 60) {
        suggestions.push({
          text: `Burn ${remaining} more calories today`,
          detail: 'Try a 30-minute brisk walk.',
          priority: 'low',
        });
      }
    });

    // Add general suggestions if few goals
    if (suggestions.length < 3) {
      suggestions.push({
        text: 'Stay consistent with your routine',
        detail: 'Consistency is key to achieving health goals.',
        priority: 'low',
      });
    }

    // Estimate completion date
    const avgProgress =
      goals.length > 0
        ? goals.reduce((acc, g) => acc + (g.target > 0 ? (g.current / g.target) * 100 : 0), 0) /
          goals.length
        : 0;

    const estimatedDaysLeft =
      avgProgress > 0 ? Math.ceil((100 - avgProgress) / (avgProgress / 7)) : 30;
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + estimatedDaysLeft);

    res.json({
      success: true,
      suggestions,
      estimatedCompletion: estimatedDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      overallProgress: Math.round(avgProgress),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
