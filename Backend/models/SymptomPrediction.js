import mongoose from 'mongoose';

const topPredictionSchema = new mongoose.Schema(
  {
    disease: { type: String, required: true },
    confidence: { type: Number, min: 0, max: 1 },
    reasoning: { type: String, default: '' },
  },
  { _id: false }
);

const symptomPredictionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    selectedSymptoms: [{ type: String }],
    predictedDisease: {
      type: String,
      required: true,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
    },
    topPredictions: [topPredictionSchema],
    details: {
      description: { type: String, default: '' },
      precautions: [{ type: String }],
      medications: [{ type: String }],
      diets: [{ type: String }],
      workouts: [{ type: String }],
      riskFactors: [{ type: String }],
    },
    contextualAnswers: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    adaptiveQuestionsVersion: {
      type: String,
      default: null,
    },
    refinementApplied: {
      type: Boolean,
      default: false,
    },
    refinementSource: {
      type: String,
      enum: ['none', 'rules', 'llm', 'hybrid'],
      default: 'none',
    },
    predictionSource: {
      type: String,
      enum: ['none', 'ml', 'llm', 'ensemble'],
      default: 'ml',
    },
    emergencyOverrides: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

symptomPredictionSchema.index({ user: 1, createdAt: -1 });

const SymptomPrediction = mongoose.model('SymptomPrediction', symptomPredictionSchema);

export default SymptomPrediction;
