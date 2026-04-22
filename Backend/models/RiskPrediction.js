import mongoose from 'mongoose';

const riskPredictionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Input vitals
    input: {
      age: { type: Number, required: true },
      gender: { type: String, required: true },
      weight: Number,
      height: Number,
      bloodPressure: { type: String, required: true },
      cholesterol: { type: Number, required: true },
      bloodSugar: { type: Number, required: true },
      bmi: Number,
      smokingStatus: String,
      alcoholConsumption: String,
      exerciseFrequency: String,
      familyHistory: [String],
    },
    // AI-generated results
    results: {
      overallRisk: {
        type: String,
        enum: ['low', 'moderate', 'high', 'critical'],
      },
      heartDiseaseRisk: { type: Number, min: 0, max: 100 },
      diabetesRisk: { type: Number, min: 0, max: 100 },
      strokeRisk: { type: Number, min: 0, max: 100 },
      bpRisk: { type: Number, min: 0, max: 100 },
      summary: String,
      recommendations: [String],
    },
    // Recommended doctors
    recommendedDoctors: [
      {
        name: String,
        specialty: String,
        distance: String,
        rating: Number,
        image: String,
      },
    ],
    // Diet plan
    dietPlan: {
      breakfast: String,
      lunch: String,
      dinner: String,
      snacks: String,
      notes: String,
    },
    // Workout plan
    workoutPlan: [
      {
        day: String,
        exercise: String,
        duration: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

riskPredictionSchema.index({ user: 1, createdAt: -1 });

const RiskPrediction = mongoose.model('RiskPrediction', riskPredictionSchema);
export default RiskPrediction;
