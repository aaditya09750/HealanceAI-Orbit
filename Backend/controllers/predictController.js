import Notification from '../models/Notification.js';
import RiskPrediction from '../models/RiskPrediction.js';
import SymptomPrediction from '../models/SymptomPrediction.js';
import path from 'path';
import { fileURLToPath } from 'url';
import runPythonPrediction, { runPythonScript } from '../utils/mlPredictor.js';
import {
  normalizeWhatsAppNumber,
  isValidWhatsAppNumber,
  sendWhatsAppTextMessage,
} from '../utils/sendWhatsApp.js';
import { buildAdaptiveQuestions } from '../utils/adaptiveQuestionGenerator.js';
import { refinePrediction, applyEmergencyOverrides } from '../utils/predictionRefiner.js';
import { predictDiseaseWithLLM, catalogEntryToDetails } from '../utils/llmDiseasePredictor.js';
import { reviewPredictions } from '../utils/llmClinicalReviewer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const symptomScriptPath = path.resolve(
  __dirname,
  '../../ML Services/Symtums_diseas/predict_symptom_disease.py'
);
const symptomFeatures = [
  'fever',
  'cough',
  'headache',
  'fatigue',
  'vomiting',
  'chest_pain',
  'sore_throat',
  'breathlessness',
  'nausea',
  'dizziness',
  'body_pain',
  'diarrhea',
  'skin_rash',
  'itching',
  'weight_loss',
  'sweating',
];

const parseNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const computeBmi = (weightKg, heightCm) => {
  const heightM = heightCm / 100;
  if (!heightM) return null;
  return Number((weightKg / (heightM * heightM)).toFixed(2));
};

const getBmiCategory = (bmi) => {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
};

const getSuggestions = ({ diabetesResult, heartResult, bmiCategory }) => {
  const suggestions = [];

  if (diabetesResult === 'Risk') {
    suggestions.push('Reduce sugar intake and choose low-GI foods.');
    suggestions.push('Walk at least 30 minutes daily.');
  }

  if (heartResult === 'Risk') {
    suggestions.push('Limit sodium and saturated fats in your meals.');
    suggestions.push('Track blood pressure and cholesterol regularly.');
  }

  if (bmiCategory === 'Underweight') {
    suggestions.push('Add calorie-dense healthy foods and strength training.');
  }

  if (bmiCategory === 'Overweight' || bmiCategory === 'Obese') {
    suggestions.push('Target gradual weight loss with diet and exercise balance.');
  }

  if (!suggestions.length) {
    suggestions.push('Keep maintaining your balanced routine and yearly checkups.');
  }

  return suggestions;
};

const probabilityToRiskScore = (probability) => {
  if (typeof probability !== 'number' || Number.isNaN(probability)) return null;
  return Math.max(0, Math.min(100, Math.round(probability * 100)));
};

const overallRiskFromScore = (score = 0) => {
  if (score > 70) return 'critical';
  if (score > 50) return 'high';
  if (score > 25) return 'moderate';
  return 'low';
};

const savePredictionRecord = async ({
  userId,
  validated,
  bmi,
  diabetesRisk,
  heartRisk,
  summary,
  recommendations,
}) => {
  const maxRisk = Math.max(diabetesRisk || 0, heartRisk || 0);
  const overallRisk = overallRiskFromScore(maxRisk);

  await RiskPrediction.create({
    user: userId,
    input: {
      age: validated.age,
      gender: validated.gender,
      weight: validated.weight,
      height: validated.height,
      bloodPressure: String(validated.bloodPressure),
      cholesterol: validated.cholesterol,
      bloodSugar: validated.glucose,
      bmi,
      familyHistory: [],
    },
    results: {
      overallRisk,
      heartDiseaseRisk: heartRisk,
      diabetesRisk,
      summary,
      recommendations,
    },
  });
};

const validateCommonInputs = (body) => {
  const age = parseNumber(body.age);
  const genderRaw = String(body.gender || '')
    .trim()
    .toLowerCase();
  const weight = parseNumber(body.weight);
  const height = parseNumber(body.height);
  const glucose = parseNumber(body.glucose);
  const bloodPressure = parseNumber(body.bloodPressure);
  const cholesterol = parseNumber(body.cholesterol);

  if (!age || age < 1 || age > 120) {
    return { error: 'Age must be between 1 and 120.' };
  }

  if (!['male', 'female'].includes(genderRaw)) {
    return { error: 'Gender must be Male or Female.' };
  }

  if (!weight || weight < 20 || weight > 350) {
    return { error: 'Weight must be between 20 and 350 kg.' };
  }

  if (!height || height < 90 || height > 250) {
    return { error: 'Height must be between 90 and 250 cm.' };
  }

  if (!glucose || glucose < 40 || glucose > 500) {
    return { error: 'Glucose must be between 40 and 500.' };
  }

  if (!bloodPressure || bloodPressure < 40 || bloodPressure > 280) {
    return { error: 'Blood pressure must be between 40 and 280.' };
  }

  if (!cholesterol || cholesterol < 80 || cholesterol > 700) {
    return { error: 'Cholesterol must be between 80 and 700.' };
  }

  return {
    age,
    gender: genderRaw,
    weight,
    height,
    glucose,
    bloodPressure,
    cholesterol,
  };
};

// @desc    Predict diabetes risk
// @route   POST /api/predict/diabetes
// @access  Private
export const predictDiabetes = async (req, res) => {
  try {
    const validated = validateCommonInputs(req.body);
    if (validated.error) {
      return res.status(400).json({ success: false, message: validated.error });
    }

    const bmi = req.body.bmi
      ? parseNumber(req.body.bmi)
      : computeBmi(validated.weight, validated.height);
    if (!bmi) {
      return res.status(400).json({ success: false, message: 'BMI could not be calculated.' });
    }

    const payload = {
      modelType: 'diabetes',
      features: {
        age: validated.age,
        glucose: validated.glucose,
        bmi,
      },
    };

    const prediction = await runPythonPrediction(payload);
    const diabetesRisk = probabilityToRiskScore(prediction.probability);
    const recommendations = getSuggestions({
      diabetesResult: prediction.result,
      heartResult: 'No Risk',
      bmiCategory: getBmiCategory(bmi),
    });

    await savePredictionRecord({
      userId: req.user._id,
      validated,
      bmi,
      diabetesRisk,
      heartRisk: null,
      summary: `Diabetes prediction: ${prediction.result}`,
      recommendations,
    });

    return res.json({
      success: true,
      diabetes: prediction.result,
      probability: prediction.probability,
      bmi,
      bmiCategory: getBmiCategory(bmi),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Predict heart disease risk
// @route   POST /api/predict/heart
// @access  Private
export const predictHeart = async (req, res) => {
  try {
    const validated = validateCommonInputs(req.body);
    if (validated.error) {
      return res.status(400).json({ success: false, message: validated.error });
    }

    const bmi = req.body.bmi
      ? parseNumber(req.body.bmi)
      : computeBmi(validated.weight, validated.height);
    if (!bmi) {
      return res.status(400).json({ success: false, message: 'BMI could not be calculated.' });
    }

    const fbs = validated.glucose > 120 ? 1 : 0;
    const payload = {
      modelType: 'heart',
      features: {
        age: validated.age,
        gender: validated.gender === 'male' ? 1 : 0,
        blood_pressure: validated.bloodPressure,
        cholesterol: validated.cholesterol,
        fbs,
      },
    };

    const prediction = await runPythonPrediction(payload);
    const heartRisk = probabilityToRiskScore(prediction.probability);
    const recommendations = getSuggestions({
      diabetesResult: 'No Risk',
      heartResult: prediction.result,
      bmiCategory: getBmiCategory(bmi),
    });

    await savePredictionRecord({
      userId: req.user._id,
      validated,
      bmi,
      diabetesRisk: null,
      heartRisk,
      summary: `Heart prediction: ${prediction.result}`,
      recommendations,
    });

    return res.json({
      success: true,
      heart: prediction.result,
      probability: prediction.probability,
      bmi,
      bmiCategory: getBmiCategory(bmi),
      fbs,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Predict both heart and diabetes risk
// @route   POST /api/predict/all
// @access  Private
export const predictAll = async (req, res) => {
  try {
    const validated = validateCommonInputs(req.body);
    if (validated.error) {
      return res.status(400).json({ success: false, message: validated.error });
    }

    const bmi = req.body.bmi
      ? parseNumber(req.body.bmi)
      : computeBmi(validated.weight, validated.height);
    if (!bmi) {
      return res.status(400).json({ success: false, message: 'BMI could not be calculated.' });
    }

    const fbs = validated.glucose > 120 ? 1 : 0;

    const [diabetesPrediction, heartPrediction] = await Promise.all([
      runPythonPrediction({
        modelType: 'diabetes',
        features: {
          age: validated.age,
          glucose: validated.glucose,
          bmi,
        },
      }),
      runPythonPrediction({
        modelType: 'heart',
        features: {
          age: validated.age,
          gender: validated.gender === 'male' ? 1 : 0,
          blood_pressure: validated.bloodPressure,
          cholesterol: validated.cholesterol,
          fbs,
        },
      }),
    ]);

    const diabetesResult = diabetesPrediction.result;
    const heartResult = heartPrediction.result;
    const bmiCategory = getBmiCategory(bmi);
    const suggestions = getSuggestions({ diabetesResult, heartResult, bmiCategory });
    const diabetesRisk = probabilityToRiskScore(diabetesPrediction.probability);
    const heartRisk = probabilityToRiskScore(heartPrediction.probability);

    await savePredictionRecord({
      userId: req.user._id,
      validated,
      bmi,
      diabetesRisk,
      heartRisk,
      summary: `Combined prediction: Diabetes ${diabetesResult}, Heart ${heartResult}`,
      recommendations: suggestions,
    });

    await Notification.create({
      user: req.user._id,
      title: 'ML Risk Prediction Ready',
      message: `Diabetes: ${diabetesResult}, Heart: ${heartResult}`,
      type: 'health',
      link: '/dashboard/risk-prediction/heart-diabetes',
    });

    return res.json({
      success: true,
      diabetes: diabetesResult,
      heart: heartResult,
      probability: {
        diabetes: diabetesPrediction.probability,
        heart: heartPrediction.probability,
      },
      bmi,
      bmiCategory,
      fbs,
      suggestions,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get adaptive follow-up questions for a given symptom set
// @route   POST /api/predict/adaptive-questions
// @access  Private
export const getAdaptiveQuestions = async (req, res) => {
  try {
    const rawSymptoms = Array.isArray(req.body?.symptoms) ? req.body.symptoms : [];
    const symptoms = rawSymptoms
      .map((s) =>
        String(s || '')
          .trim()
          .toLowerCase()
      )
      .filter((s) => symptomFeatures.includes(s));

    if (symptoms.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Select at least one valid symptom.',
      });
    }

    // Prefer saved profile from the authenticated user so we don't trust
    // client-injected demographics; fall back to whatever profile the
    // client passed (useful during onboarding before a profile is saved).
    const storedProfile = req.user?.profile || {};
    const clientProfile = req.body?.profile || {};
    const profile = {
      age: storedProfile.age ?? clientProfile.age ?? null,
      gender: storedProfile.gender ?? clientProfile.gender ?? null,
      medicalConditions:
        Array.isArray(storedProfile.medicalConditions) && storedProfile.medicalConditions.length
          ? storedProfile.medicalConditions
          : clientProfile.medicalConditions || [],
      medications:
        Array.isArray(storedProfile.medications) && storedProfile.medications.length
          ? storedProfile.medications
          : clientProfile.medications || [],
    };

    const { questions, source, version } = await buildAdaptiveQuestions(symptoms, profile);

    return res.json({
      success: true,
      status: 'ok',
      questions,
      source,
      version,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Predict disease from symptoms and return guidance
// @route   POST /api/predict/symptoms-disease
// @access  Private
export const predictSymptomsDisease = async (req, res) => {
  try {
    const payloadFeatures = {};

    symptomFeatures.forEach((feature) => {
      const raw = req.body[feature];
      payloadFeatures[feature] =
        raw === true || raw === 1 || String(raw).toLowerCase() === 'true' ? 1 : 0;
    });

    const selectedCount = Object.values(payloadFeatures).filter((value) => value === 1).length;
    if (selectedCount < 2) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least 2 symptoms for better prediction.',
      });
    }

    // Accept optional contextual follow-up answers; ignore anything that
    // isn't a primitive / array to keep the Mixed field sane.
    const rawAnswers = req.body?.contextualAnswers;
    const contextualAnswers =
      rawAnswers && typeof rawAnswers === 'object' && !Array.isArray(rawAnswers) ? rawAnswers : {};
    const adaptiveQuestionsVersion =
      typeof req.body?.adaptiveQuestionsVersion === 'string'
        ? req.body.adaptiveQuestionsVersion
        : null;

    const selectedSymptomKeys = symptomFeatures.filter((k) => payloadFeatures[k] === 1);
    const storedProfile = req.user?.profile || {};
    const profileForLlm = {
      age: storedProfile.age ?? null,
      gender: storedProfile.gender ?? null,
      medicalConditions: storedProfile.medicalConditions || [],
      medications: storedProfile.medications || [],
    };

    // ─── Parallel fan-out: ML + LLM predict simultaneously ───
    // Pass contextualAnswers through to the Python model — the Phase 2
    // retrained pipeline reads `context` alongside `features` and feeds
    // both through a ColumnTransformer so fever_temp_f / fever_duration /
    // recent_food etc meaningfully change the prediction.
    const [mlSettled, llmSettled] = await Promise.allSettled([
      runPythonScript(symptomScriptPath, {
        features: payloadFeatures,
        context: contextualAnswers,
      }),
      predictDiseaseWithLLM({
        symptoms: selectedSymptomKeys,
        contextualAnswers,
        profile: profileForLlm,
      }),
    ]);

    const mlPrediction = mlSettled.status === 'fulfilled' ? mlSettled.value : null;
    const llmCandidates =
      llmSettled.status === 'fulfilled' && Array.isArray(llmSettled.value) ? llmSettled.value : [];

    // ─── Tier A + Tier B refinement on ML candidates only (unchanged
    // interaction with the python pipeline — still returns adjusted top-5)
    let mlCandidates = [];
    let refinementApplied = false;
    let refinementSource = 'none';
    let refinementReasons = [];
    let mlDetails = {};
    let mlSelectedSymptoms = selectedSymptomKeys;

    if (mlPrediction) {
      mlDetails = mlPrediction.details || {};
      mlSelectedSymptoms = mlPrediction.selectedSymptoms || selectedSymptomKeys;
      const refined = await refinePrediction(mlPrediction, {
        contextualAnswers,
        profile: profileForLlm,
        symptoms: selectedSymptomKeys,
      });
      mlCandidates = refined.topPredictions || [];
      refinementApplied = refined.refinementApplied;
      refinementSource = refined.refinementSource;
      refinementReasons = refined.refinementReasons || [];
    }

    // If both predictors produced nothing, bail with a 503-equivalent message.
    if (mlCandidates.length === 0 && llmCandidates.length === 0) {
      return res.status(503).json({
        success: false,
        message: 'Prediction service temporarily unavailable. Please try again shortly.',
      });
    }

    // ─── Clinical reviewer merges the two lists and attaches reasoning ───
    const reviewed = await reviewPredictions({
      mlCandidates,
      llmCandidates,
      symptoms: selectedSymptomKeys,
      contextualAnswers,
      profile: profileForLlm,
    });

    // ─── Emergency overrides — last-resort safety net ───
    const overrideResult = applyEmergencyOverrides({
      predictions: reviewed.predictions,
      contextualAnswers,
      profile: profileForLlm,
    });

    const finalTop = overrideResult.predictions;

    if (finalTop.length === 0) {
      return res.status(503).json({
        success: false,
        message: 'Prediction service temporarily unavailable. Please try again shortly.',
      });
    }

    // ─── Hydrate UI details from the top prediction's catalog entry when
    //     available; otherwise fall back to the ML python details (for
    //     backward compatibility with the 14 originally-trained diseases).
    const topEntry = finalTop[0].catalogEntry;
    const details = topEntry ? catalogEntryToDetails(topEntry) : mlDetails;

    // Strip catalogEntry/injected flags from DB + API response.
    const topForClient = finalTop.map((p) => ({
      disease: p.disease,
      confidence: p.confidence,
      reasoning: p.reasoning || '',
    }));

    const predictionSource = reviewed.source === 'none' ? 'ml' : reviewed.source;
    const emergencyOverrideIds = overrideResult.overrides.map((o) => o.rule);

    await SymptomPrediction.create({
      user: req.user._id,
      selectedSymptoms: mlSelectedSymptoms,
      predictedDisease: finalTop[0].disease,
      confidence: finalTop[0].confidence,
      topPredictions: topForClient,
      details,
      contextualAnswers,
      adaptiveQuestionsVersion,
      refinementApplied,
      refinementSource,
      predictionSource,
      emergencyOverrides: emergencyOverrideIds,
    });

    return res.json({
      success: true,
      selectedSymptoms: mlSelectedSymptoms,
      predictedDisease: finalTop[0].disease,
      confidence: finalTop[0].confidence,
      topPredictions: topForClient,
      details,
      refinementApplied,
      refinementSource,
      refinementReasons,
      predictionSource,
      emergencyOverrides: emergencyOverrideIds,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get symptoms prediction history
// @route   GET /api/predict/symptoms-history
// @access  Private
export const getSymptomsPredictionHistory = async (req, res) => {
  try {
    const isAll = String(req.query.all || '').toLowerCase() === 'true';
    const requestedLimit = Number(req.query.limit);
    const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 500) : 5;

    const query = SymptomPrediction.find({ user: req.user._id }).sort({ createdAt: -1 });
    if (!isAll) {
      query.limit(limit);
    }

    const predictions = await query;

    return res.json({
      success: true,
      predictions,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const toBulletLines = (items = [], max = 5) => {
  if (!Array.isArray(items) || items.length === 0) return ['- Not available'];
  return items.slice(0, max).map((item) => `- ${String(item).replace(/\s+/g, ' ').trim()}`);
};

const section = (title, lines = []) => [title, ...lines, ''];

// @desc    Share symptom disease prediction on WhatsApp
// @route   POST /api/predict/share-symptoms-whatsapp
// @access  Private
export const shareSymptomsPredictionOnWhatsApp = async (req, res) => {
  try {
    const { predictedDisease, confidence, topPredictions, selectedSymptoms, details } = req.body;

    if (!predictedDisease) {
      return res.status(400).json({
        success: false,
        message: 'predictedDisease is required.',
      });
    }

    if (!req.user?.whatsappNumber) {
      return res.status(400).json({
        success: false,
        message: 'No WhatsApp number found in your profile. Please add it first.',
      });
    }

    const normalized = normalizeWhatsAppNumber(req.user.whatsappNumber);
    if (!isValidWhatsAppNumber(normalized)) {
      return res.status(400).json({ success: false, message: 'Invalid WhatsApp number.' });
    }

    const safeDetails = details || {};
    const confidencePercent =
      typeof confidence === 'number' ? `${Math.round(confidence * 100)}%` : 'N/A';

    const topPredictionsLines =
      Array.isArray(topPredictions) && topPredictions.length
        ? topPredictions.slice(0, 3).map((item) => {
            const c =
              typeof item?.confidence === 'number'
                ? `${Math.round(item.confidence * 100)}%`
                : 'N/A';
            return `- ${item?.disease || 'Unknown'} (${c})`;
          })
        : ['- Not available'];

    const selectedSymptomsLines = toBulletLines(selectedSymptoms, 8);
    const precautionsLines = toBulletLines(safeDetails.precautions, 6);
    const medicationsLines = toBulletLines(safeDetails.medications, 6);
    const dietsLines = toBulletLines(safeDetails.diets, 6);
    const workoutsLines = toBulletLines(safeDetails.workouts, 6);
    const riskFactorsLines = toBulletLines(safeDetails.riskFactors, 6);

    const patientName = req.user?.name || 'User';
    const whatsappMessage = [
      `Healance AI Health Report`,
      `Patient: ${patientName}`,
      `Generated: ${new Date().toLocaleString('en-IN')}`,
      '',
      'Prediction Summary',
      `- Predicted Disease: ${predictedDisease}`,
      `- Confidence: ${confidencePercent}`,
      '',
      ...section('Selected Symptoms', selectedSymptomsLines),
      ...section('Top 3 Predictions', topPredictionsLines),
      ...section('Description', [safeDetails.description || 'Not available']),
      ...section('Precautions', precautionsLines),
      ...section('Medications', medicationsLines),
      ...section('Diet Plan', dietsLines),
      ...section('Workout Plan', workoutsLines),
      ...section('Risk Factors', riskFactorsLines),
      'Disclaimer',
      '- This is an AI-assisted prediction and not a final diagnosis.',
      '- Please consult a qualified doctor for medical advice.',
    ].join('\n');

    const sendResult = await sendWhatsAppTextMessage(normalized, whatsappMessage);

    return res.json({
      success: true,
      message: sendResult.sent
        ? 'Symptoms prediction sent to WhatsApp successfully.'
        : 'WhatsApp credentials missing. Message simulated in dev mode.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Share latest prediction on WhatsApp
// @route   POST /api/predict/share-whatsapp
// @access  Private
export const sharePredictionOnWhatsApp = async (req, res) => {
  try {
    const { diabetes, heart, bmi, bmiCategory } = req.body;

    if (!diabetes || !heart) {
      return res.status(400).json({
        success: false,
        message: 'diabetes and heart are required.',
      });
    }

    if (!req.user?.whatsappNumber) {
      return res.status(400).json({
        success: false,
        message: 'No WhatsApp number found in your profile. Please add it first.',
      });
    }

    const normalized = normalizeWhatsAppNumber(req.user.whatsappNumber);
    if (!isValidWhatsAppNumber(normalized)) {
      return res.status(400).json({ success: false, message: 'Invalid WhatsApp number.' });
    }

    const patientName = req.user?.name || 'User';
    const message = [
      `Hi ${patientName}, your Healance ML prediction summary:`,
      `Diabetes Risk: ${diabetes}`,
      `Heart Risk: ${heart}`,
      bmi ? `BMI: ${bmi}` : null,
      bmiCategory ? `BMI Category: ${bmiCategory}` : null,
      'Please consult a doctor for clinical diagnosis.',
    ]
      .filter(Boolean)
      .join('\n');

    const sendResult = await sendWhatsAppTextMessage(normalized, message);

    return res.json({
      success: true,
      message: sendResult.sent
        ? 'Prediction sent to WhatsApp successfully.'
        : 'WhatsApp credentials missing. Message simulated in dev mode.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
