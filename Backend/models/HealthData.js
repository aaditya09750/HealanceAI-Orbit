import mongoose from 'mongoose';

const healthDataSchema = new mongoose.Schema(
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
    // Daily vitals
    vitals: {
      heartRate: { type: Number }, // bpm
      bloodPressure: {
        systolic: Number,
        diastolic: Number,
      },
      bloodSugar: Number, // mg/dL
      oxygenLevel: Number, // SpO2 %
      temperature: Number, // °F
      weight: Number, // kg
    },
    // Activity tracking
    activity: {
      steps: { type: Number, default: 0 },
      caloriesBurned: { type: Number, default: 0 },
      activeMinutes: { type: Number, default: 0 },
      distance: { type: Number, default: 0 }, // km
    },
    // Water intake
    waterIntake: { type: Number, default: 0 }, // in liters
    // Sleep
    sleep: {
      duration: Number, // hours
      quality: { type: String, enum: ['poor', 'fair', 'good', 'excellent'] },
      bedtime: String,
      wakeTime: String,
    },
    // Health score (calculated by AI)
    healthScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    // Mood tracking
    mood: {
      type: String,
      enum: ['great', 'good', 'neutral', 'bad', 'terrible'],
    },
    // Notes
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
healthDataSchema.index({ user: 1, date: -1 });

const HealthData = mongoose.model('HealthData', healthDataSchema);
export default HealthData;
