import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['steps', 'water', 'calories', 'sleep', 'weight', 'custom'],
      required: true,
    },
    title: { type: String, required: true },
    current: { type: Number, default: 0 },
    target: { type: Number, required: true },
    unit: { type: String, required: true },
    startDate: { type: Date, default: Date.now },
    endDate: Date,
    isCompleted: { type: Boolean, default: false },
    // Weekly progress tracking
    weeklyProgress: [
      {
        day: String,
        value: Number,
        date: Date,
      },
    ],
    // AI suggestions for this goal
    aiSuggestions: [
      {
        text: String,
        priority: { type: String, enum: ['low', 'medium', 'high'] },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

goalSchema.index({ user: 1, isCompleted: 1 });

// Virtual for progress percentage
goalSchema.virtual('progress').get(function () {
  if (this.target === 0) return 0;
  return Math.min(Math.round((this.current / this.target) * 100), 100);
});

goalSchema.set('toJSON', { virtuals: true });

const Goal = mongoose.model('Goal', goalSchema);
export default Goal;
