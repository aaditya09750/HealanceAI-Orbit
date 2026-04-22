import mongoose from 'mongoose';

const walkEarnSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    steps: { type: Number, default: 0 },
    dailyGoal: { type: Number, default: 10000 },
    coinsEarned: { type: Number, default: 0 },
    // Steps to coins conversion: 1000 steps = 10 coins
  },
  {
    timestamps: true,
  }
);

walkEarnSchema.index({ user: 1, date: -1 });

const rewardSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    image: String,
    coinsRequired: { type: Number, required: true },
    category: {
      type: String,
      enum: ['voucher', 'subscription', 'merchandise', 'donation'],
      default: 'voucher',
    },
    isActive: { type: Boolean, default: true },
    stock: { type: Number, default: -1 }, // -1 = unlimited
  },
  {
    timestamps: true,
  }
);

const redemptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reward: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reward',
      required: true,
    },
    coinsSpent: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'fulfilled', 'cancelled'],
      default: 'pending',
    },
    redeemedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

export const WalkEarn = mongoose.model('WalkEarn', walkEarnSchema);
export const Reward = mongoose.model('Reward', rewardSchema);
export const Redemption = mongoose.model('Redemption', redemptionSchema);
