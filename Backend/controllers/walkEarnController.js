import { WalkEarn, Reward, Redemption } from '../models/WalkEarn.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

// Steps to coins conversion rate: 1000 steps = 10 coins
const STEPS_PER_COIN = 100; // 100 steps = 1 coin

// @desc    Log daily steps & earn coins
// @route   POST /api/walk-earn/log-steps
// @access  Private
export const logSteps = async (req, res) => {
  try {
    const { steps } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find or create today's record
    let record = await WalkEarn.findOne({
      user: req.user._id,
      date: { $gte: today, $lt: tomorrow },
    });

    if (record) {
      const additionalSteps = steps - record.steps;
      if (additionalSteps > 0) {
        const newCoins = Math.floor(additionalSteps / STEPS_PER_COIN);
        record.steps = steps;
        record.coinsEarned += newCoins;
        await record.save();

        // Update user's total coins
        await User.findByIdAndUpdate(req.user._id, {
          $inc: { coins: newCoins, totalStepsAllTime: additionalSteps },
        });
      }
    } else {
      const coinsEarned = Math.floor(steps / STEPS_PER_COIN);
      record = await WalkEarn.create({
        user: req.user._id,
        steps,
        coinsEarned,
      });

      await User.findByIdAndUpdate(req.user._id, {
        $inc: { coins: coinsEarned, totalStepsAllTime: steps },
      });
    }

    const user = await User.findById(req.user._id);

    res.json({
      success: true,
      todaySteps: record.steps,
      todayCoins: record.coinsEarned,
      totalCoins: user.coins,
      dailyGoal: record.dailyGoal,
      stepsRemaining: Math.max(0, record.dailyGoal - record.steps),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get walk & earn summary
// @route   GET /api/walk-earn/summary
// @access  Private
export const getSummary = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayRecord = await WalkEarn.findOne({
      user: req.user._id,
      date: { $gte: today, $lt: tomorrow },
    });

    // Get last 7 days
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weeklyRecords = await WalkEarn.find({
      user: req.user._id,
      date: { $gte: weekAgo },
    }).sort({ date: 1 });

    res.json({
      success: true,
      totalCoins: user.coins,
      todaySteps: todayRecord?.steps || 0,
      dailyGoal: todayRecord?.dailyGoal || 10000,
      todayCoins: todayRecord?.coinsEarned || 0,
      weeklyData: weeklyRecords.map((r) => ({
        date: r.date,
        steps: r.steps,
        coins: r.coinsEarned,
      })),
      totalStepsAllTime: user.totalStepsAllTime,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get available rewards
// @route   GET /api/walk-earn/rewards
// @access  Private
export const getRewards = async (req, res) => {
  try {
    const rewards = await Reward.find({ isActive: true }).sort({ coinsRequired: 1 });
    const user = await User.findById(req.user._id);

    res.json({
      success: true,
      rewards: rewards.map((r) => ({
        ...r.toObject(),
        canRedeem: user.coins >= r.coinsRequired,
      })),
      userCoins: user.coins,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Redeem a reward
// @route   POST /api/walk-earn/redeem/:rewardId
// @access  Private
export const redeemReward = async (req, res) => {
  try {
    const reward = await Reward.findById(req.params.rewardId);
    if (!reward || !reward.isActive) {
      return res.status(404).json({ success: false, message: 'Reward not found or inactive' });
    }

    const user = await User.findById(req.user._id);
    if (user.coins < reward.coinsRequired) {
      return res.status(400).json({
        success: false,
        message: `You need ${reward.coinsRequired - user.coins} more coins`,
      });
    }

    // Check stock
    if (reward.stock !== -1 && reward.stock <= 0) {
      return res.status(400).json({ success: false, message: 'This reward is out of stock' });
    }

    // Deduct coins
    user.coins -= reward.coinsRequired;
    await user.save();

    // Update stock
    if (reward.stock !== -1) {
      reward.stock -= 1;
      await reward.save();
    }

    // Create redemption record
    const redemption = await Redemption.create({
      user: user._id,
      reward: reward._id,
      coinsSpent: reward.coinsRequired,
    });

    // Send notification
    await Notification.create({
      user: user._id,
      title: 'Reward Redeemed! 🎁',
      message: `You have successfully redeemed: ${reward.title}`,
      type: 'achievement',
    });

    res.json({
      success: true,
      message: `Successfully redeemed: ${reward.title}`,
      remainingCoins: user.coins,
      redemption,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get redemption history
// @route   GET /api/walk-earn/redemptions
// @access  Private
export const getRedemptions = async (req, res) => {
  try {
    const redemptions = await Redemption.find({ user: req.user._id })
      .populate('reward')
      .sort({ redeemedAt: -1 });

    res.json({ success: true, redemptions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
