import ChatSession from '../models/ChatSession.js';
import Doctor, { DOCTOR_SPECIALTIES } from '../models/Doctor.js';
import { searchDrugInfo, formatDrugResponse, getDrugNotFoundResponse } from '../utils/fdaApi.js';
import { analyzeReportById } from '../utils/reportAnalyzer.js';
import { normalizeDrug, getDrugClass, matchInteractionsInLabel } from '../utils/rxNavApi.js';
import { cleanFdaText } from '../utils/fdaTextCleaner.js';
import { findNearbyHealthcare } from '../utils/osmOverpass.js';
import { resolveLocation } from '../utils/geocode.js';
import OpenAI from 'openai';

const MEDICINE_DISCLAIMER =
  'Drug information is sourced from the US FDA drug label. This is general information only, not medical advice — consult your doctor or pharmacist before starting, stopping, or changing any medication.';

const DOCTORS_DISCLAIMER =
  'Results combine curated partner doctors and public OpenStreetMap data. Please verify credentials, availability and fees directly with the practice before booking.';

// Function to get OpenAI client (lazy initialization)
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey === 'sk-your-openai-api-key-here') {
    return null;
  }

  return new OpenAI({ apiKey });
};

// Medicine database for the Medicine Info Bot (FALLBACK - Now using FDA API)
const medicineDB = {
  paracetamol: {
    name: 'Paracetamol (Acetaminophen)',
    uses: 'Pain reliever and fever reducer. Used for headaches, muscle aches, arthritis, backache, toothaches, colds, and fevers.',
    dosage: '500mg-1000mg every 4-6 hours. Maximum 4g/day for adults.',
    sideEffects:
      'Nausea, liver damage (high doses), allergic reactions (rare), blood disorders (very rare).',
    precautions:
      'Do not exceed 4g/day. Avoid with alcohol. Consult doctor if liver disease present.',
    interactions: 'Warfarin, Carbamazepine, Isoniazid',
  },
  ibuprofen: {
    name: 'Ibuprofen',
    uses: 'Anti-inflammatory pain reliever. Used for arthritis, menstrual cramps, dental pain, muscle aches.',
    dosage: '200-400mg every 4-6 hours. Maximum 1200mg/day (OTC).',
    sideEffects: 'Stomach upset, heartburn, dizziness, mild headache, kidney problems (long-term).',
    precautions:
      'Take with food. Avoid if history of stomach ulcers. Not recommended in late pregnancy.',
    interactions: 'Aspirin, Blood thinners, ACE inhibitors, Lithium',
  },
  aspirin: {
    name: 'Aspirin (Acetylsalicylic Acid)',
    uses: 'Pain relief, fever reducer, anti-inflammatory, blood thinner for heart attack prevention.',
    dosage: '325-650mg every 4-6 hours for pain. 75-100mg daily for heart protection.',
    sideEffects: 'Stomach bleeding, ulcers, tinnitus, allergic reactions.',
    precautions: 'Not for children under 16 (Reye syndrome risk). Avoid before surgery.',
    interactions: 'Warfarin, Methotrexate, SSRIs, other NSAIDs',
  },
  amoxicillin: {
    name: 'Amoxicillin',
    uses: 'Antibiotic for bacterial infections: ear infections, UTIs, respiratory infections, H. pylori.',
    dosage: '250-500mg every 8 hours, or 500-875mg every 12 hours for 7-14 days.',
    sideEffects: 'Diarrhea, nausea, skin rash, vomiting.',
    precautions:
      'Complete full course. Inform doctor of penicillin allergy. May reduce birth control efficacy.',
    interactions: 'Methotrexate, Warfarin, Probenecid',
  },
  metformin: {
    name: 'Metformin',
    uses: 'Type 2 diabetes management. Helps control blood sugar levels.',
    dosage: 'Start 500mg twice daily, max 2000mg/day. Take with meals.',
    sideEffects:
      'Nausea, diarrhea, stomach pain, metallic taste, vitamin B12 deficiency (long-term).',
    precautions:
      'Monitor kidney function. Stop before contrast dye procedures. Avoid excessive alcohol.',
    interactions: 'Contrast dyes, Alcohol, Certain diuretics',
  },
};

// Health symptom responses
const symptomResponses = {
  headache:
    'For headaches: Stay hydrated, rest in a dark room, try over-the-counter pain relief. If persistent or severe, consult a doctor. Common causes include stress, dehydration, eye strain, and poor posture.',
  fever:
    'For fever: Rest and stay hydrated. Take paracetamol or ibuprofen as directed. Seek medical help if temperature exceeds 103°F (39.4°C), lasts over 3 days, or is accompanied by severe symptoms.',
  cold: 'For common cold: Rest, drink warm fluids, use steam inhalation, take vitamin C. Most colds resolve in 7-10 days. See a doctor if symptoms worsen or you have difficulty breathing.',
  cough:
    'For cough: Stay hydrated, use honey and warm water, try steam inhalation. If cough persists beyond 3 weeks, produces blood, or is accompanied by fever, consult a doctor immediately.',
  stomach:
    'For stomach issues: Eat bland foods (BRAT diet), stay hydrated, avoid spicy/oily foods. If you experience severe pain, blood in stool, or symptoms lasting over 48 hours, see a doctor.',
  anxiety:
    'For anxiety: Practice deep breathing exercises (4-7-8 technique), try progressive muscle relaxation, limit caffeine, exercise regularly. If anxiety is persistent and affecting daily life, consider speaking with a mental health professional.',
  sleep:
    'For sleep issues: Maintain consistent sleep schedule, avoid screens 1 hour before bed, create a dark/cool room environment, limit caffeine after 2pm. If insomnia persists, consult a sleep specialist.',
  back: 'For back pain: Apply ice for first 48 hours, then switch to heat. Gentle stretching and walking help. Maintain good posture. See a doctor if pain radiates down legs or is accompanied by numbness.',
  stress:
    'For stress management: Practice mindfulness meditation, regular exercise (30 mins daily), adequate sleep (7-8 hours), healthy diet, and time management. Consider therapy if stress becomes overwhelming.',
  diabetes:
    'For diabetes management: Monitor blood sugar regularly, maintain healthy weight, balanced diet (low glycemic index foods), regular exercise, take medications as prescribed. Regular check-ups with your doctor are essential.',
  blood:
    "For blood pressure: Reduce salt intake, maintain healthy weight, exercise regularly (150 mins/week), limit alcohol, quit smoking, manage stress. Monitor BP regularly and follow your doctor's advice.",
  heart:
    "For heart health: Eat heart-healthy diet (fruits, vegetables, whole grains, lean proteins), regular exercise, maintain healthy weight, don't smoke, limit alcohol, manage stress, and get regular check-ups.",
  pain: 'For pain management: Identify the cause first. Use appropriate pain relief (ice/heat, OTC medicines), rest, gentle movement. Chronic pain needs medical evaluation. Never ignore severe or persistent pain.',
  tired:
    'For fatigue: Ensure adequate sleep (7-9 hours), balanced diet, regular exercise, stay hydrated, manage stress, check for vitamin deficiencies. If persistent, see a doctor to rule out underlying conditions.',
  weight:
    'For healthy weight: Balanced diet with portion control, regular exercise (cardio + strength training), adequate sleep, stress management, stay hydrated. Aim for sustainable changes, not quick fixes.',
  skin: 'For skin health: Stay hydrated, use sunscreen daily (SPF 30+), gentle cleansing routine, moisturize, healthy diet rich in antioxidants, adequate sleep. Consult dermatologist for persistent issues.',
};

// Enhanced greeting and general responses
const getEnhancedResponse = (message) => {
  const lowerMsg = message.toLowerCase();

  // Greetings
  if (
    lowerMsg.match(/^(hi|hello|hey|good morning|good evening|good afternoon|namaste|hii|hiii)$/i)
  ) {
    return "👋 Hello! I'm your AI Health Assistant. I can help you with:\n\n• Common health symptoms (headache, fever, cold, etc.)\n• Wellness advice (diet, exercise, sleep)\n• Chronic conditions (diabetes, blood pressure, heart health)\n• Mental health (stress, anxiety)\n• General health guidance\n\nWhat would you like to know about?";
  }

  // Diet/nutrition
  if (
    lowerMsg.includes('diet') ||
    lowerMsg.includes('food') ||
    lowerMsg.includes('nutrition') ||
    lowerMsg.includes('eat')
  ) {
    return '🥗 **Balanced Diet Guidelines:**\n\n• **Fruits & Vegetables**: 5+ servings daily (variety of colors)\n• **Proteins**: Lean meats, fish, eggs, legumes, nuts\n• **Whole Grains**: Brown rice, quinoa, whole wheat\n• **Healthy Fats**: Olive oil, avocados, nuts\n• **Hydration**: 2-3 liters of water daily\n\n**Avoid**: Processed foods, excess sugar, high sodium\n\n💡 Tip: Practice portion control and eat mindfully!';
  }

  // Exercise/fitness
  if (
    lowerMsg.includes('exercise') ||
    lowerMsg.includes('workout') ||
    lowerMsg.includes('fitness') ||
    lowerMsg.includes('gym')
  ) {
    return '💪 **Fitness Recommendations:**\n\n• **Cardio**: 150 mins/week moderate intensity (brisk walking, jogging, cycling)\n• **Strength Training**: 2-3 times/week (all major muscle groups)\n• **Flexibility**: Daily stretching or yoga\n• **Rest**: At least 1-2 rest days per week\n\n**Getting Started:**\n1. Start slowly and gradually increase intensity\n2. Always warm up (5-10 mins) and cool down\n3. Stay hydrated\n4. Listen to your body\n\n⚠️ Consult a doctor before starting if you have health conditions.';
  }

  // Mental health
  if (
    lowerMsg.includes('mental') ||
    lowerMsg.includes('depression') ||
    lowerMsg.includes('sad') ||
    lowerMsg.includes('mood')
  ) {
    return "🧠 **Mental Health Support:**\n\nYour mental health is as important as physical health.\n\n**Self-Care Tips:**\n• Talk to someone you trust\n• Regular exercise and good sleep\n• Mindfulness and meditation\n• Limit social media and negative news\n• Practice gratitude daily\n• Engage in hobbies you enjoy\n\n**Seek Professional Help If:**\n• Symptoms persist for >2 weeks\n• Interfering with daily life\n• Having thoughts of self-harm\n\n📞 Crisis Helpline: Available 24/7\n\nYou're not alone - help is available!";
  }

  // Weight/BMI
  if (
    lowerMsg.includes('weight') ||
    lowerMsg.includes('bmi') ||
    lowerMsg.includes('fat') ||
    lowerMsg.includes('obesity')
  ) {
    return '⚖️ **Healthy Weight Management:**\n\n**BMI Categories:**\n• Underweight: <18.5\n• Normal: 18.5-24.9\n• Overweight: 25-29.9\n• Obese: 30+\n\n**Sustainable Weight Loss:**\n• Create calorie deficit (500 cal/day for 1 lb/week)\n• Balanced, nutritious diet\n• Regular exercise (cardio + strength)\n• Adequate sleep (7-9 hours)\n• Manage stress\n• Stay consistent\n\n💡 Focus on lifestyle changes, not crash diets!\n\nConsult a nutritionist for personalized plans.';
  }

  // Thank you
  if (lowerMsg.includes('thank') || lowerMsg.includes('thanks')) {
    return "😊 You're welcome! I'm here to help with your health questions anytime. Stay healthy! 💚";
  }

  return null;
};

// @desc    Send message to AI chatbot
// @route   POST /api/chatbot/message
// @access  Private
export const sendMessage = async (req, res) => {
  try {
    const { message, botType, sessionId } = req.body;

    if (!message || !botType) {
      return res.status(400).json({ success: false, message: 'Message and botType are required' });
    }

    // Find or create chat session
    let session;
    if (sessionId) {
      session = await ChatSession.findById(sessionId);
    }
    if (!session) {
      session = await ChatSession.create({
        user: req.user._id,
        botType,
        messages: [],
        title: message.substring(0, 50),
      });
    }

    // Add user message
    session.messages.push({ role: 'user', content: message, botType });

    // Generate AI response
    let responseText = '';

    if (botType === 'medicine') {
      // Medicine Info Bot - Using FDA API + OpenAI for comprehensive information
      const searchTerm = message.toLowerCase().trim();

      try {
        // First, try to fetch from FDA API
        const fdaResult = await searchDrugInfo(searchTerm);

        if (fdaResult.found) {
          // FDA data found - enhance with OpenAI for better formatting and explanation
          const fdaData = formatDrugResponse(fdaResult);
          const openai = getOpenAIClient();

          if (openai) {
            try {
              const completion = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [
                  {
                    role: 'system',
                    content: `You are a Medicine Information Assistant. You have FDA data about a medicine. Present this information in a clear, helpful way. Add context but don't contradict the FDA data. Always remind users to consult healthcare professionals.`,
                  },
                  {
                    role: 'user',
                    content: `Please help explain this medicine information from the FDA database:\n\n${fdaData}\n\nProvide a clear, helpful summary and add any important context a patient should know.`,
                  },
                ],
                temperature: 0.5,
                max_tokens: 600,
              });

              responseText =
                completion.choices[0].message.content +
                '\n\n📋 *Information sourced from FDA database and enhanced with AI assistance.*';
            } catch (aiError) {
              // If OpenAI fails, return FDA data as-is
              console.error('OpenAI enhancement failed:', aiError);
              responseText = fdaData;
            }
          } else {
            // No OpenAI key, return FDA data as-is
            responseText = fdaData;
          }
        } else {
          // FDA data not found - try OpenAI for general information
          const openai = getOpenAIClient();

          if (openai) {
            try {
              const completion = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [
                  {
                    role: 'system',
                    content: `You are a Medicine Information Bot. Provide accurate information about medications including uses, dosage, side effects, and precautions. Always emphasize consulting healthcare professionals. If you're not certain about a medicine, say so clearly.`,
                  },
                  {
                    role: 'user',
                    content: `Tell me about the medicine: ${searchTerm}`,
                  },
                ],
                temperature: 0.5,
                max_tokens: 600,
              });

              responseText =
                completion.choices[0].message.content +
                '\n\n⚠️ *This information is AI-generated. For FDA-approved information, please consult your pharmacist or healthcare provider.*';
            } catch (aiError) {
              // If OpenAI also fails, try fallback database
              const matchedMedicine = Object.keys(medicineDB).find(
                (key) => searchTerm.includes(key) || key.includes(searchTerm)
              );

              if (matchedMedicine) {
                const med = medicineDB[matchedMedicine];
                responseText =
                  `💊 **${med.name}** *(From Local Database)*\n\n` +
                  `**Uses:** ${med.uses}\n\n` +
                  `**Dosage:** ${med.dosage}\n\n` +
                  `**Side Effects:** ${med.sideEffects}\n\n` +
                  `**Precautions:** ${med.precautions}\n\n` +
                  `**Drug Interactions:** ${med.interactions}\n\n` +
                  `⚠️ *This is basic information. Always consult your doctor or pharmacist.*`;
              } else {
                responseText = getDrugNotFoundResponse(searchTerm);
              }
            }
          } else {
            // No OpenAI, try fallback database
            const matchedMedicine = Object.keys(medicineDB).find(
              (key) => searchTerm.includes(key) || key.includes(searchTerm)
            );

            if (matchedMedicine) {
              const med = medicineDB[matchedMedicine];
              responseText =
                `💊 **${med.name}** *(From Local Database)*\n\n` +
                `**Uses:** ${med.uses}\n\n` +
                `**Dosage:** ${med.dosage}\n\n` +
                `**Side Effects:** ${med.sideEffects}\n\n` +
                `**Precautions:** ${med.precautions}\n\n` +
                `**Drug Interactions:** ${med.interactions}\n\n` +
                `⚠️ *This is basic information. Always consult your doctor or pharmacist.*`;
            } else {
              responseText = getDrugNotFoundResponse(searchTerm);
            }
          }
        }
      } catch (error) {
        console.error('Medicine lookup error:', error);
        responseText = `Sorry, I encountered an error while fetching medicine information. Please try again or consult your healthcare provider.\n\nError: ${error.message}`;
      }
    } else {
      // Health Assistant Bot - Using OpenAI API for dynamic responses
      const openai = getOpenAIClient();

      if (openai) {
        try {
          // Get conversation history for context
          const conversationHistory = session.messages
            .slice(-10) // Last 10 messages for context
            .map((msg) => ({
              role: msg.role === 'assistant' ? 'assistant' : 'user',
              content: msg.content,
            }));

          // Call OpenAI API
          const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: `You are a helpful AI Health Assistant. Provide accurate, compassionate health advice while being clear that you're not a replacement for professional medical care. 
              
Guidelines:
- Provide evidence-based health information
- Be empathetic and understanding
- Always recommend consulting healthcare professionals for serious concerns
- Include practical, actionable advice
- Mention when urgent medical attention might be needed
- Keep responses concise but informative
- Cover symptoms, causes, home remedies, and when to see a doctor

Remember: You're an educational assistant, not a medical professional.`,
              },
              ...conversationHistory,
              {
                role: 'user',
                content: message,
              },
            ],
            temperature: 0.7,
            max_tokens: 500,
          });

          responseText = completion.choices[0].message.content;
        } catch (error) {
          console.error('OpenAI API error:', error);

          // Fallback to static response if OpenAI fails
          const lowerMsg = message.toLowerCase();

          // Try enhanced responses first
          const enhancedResponse = getEnhancedResponse(message);
          if (enhancedResponse) {
            responseText = enhancedResponse;
          } else {
            // Check symptom-specific responses
            const matchedSymptom = Object.keys(symptomResponses).find((key) =>
              lowerMsg.includes(key)
            );

            if (matchedSymptom) {
              responseText = symptomResponses[matchedSymptom];
            } else {
              responseText =
                '🏥 **General Health Advice:**\n\nI can help you with:\n• Specific symptoms (headache, fever, cough, etc.)\n• Diet and nutrition guidance\n• Exercise recommendations\n• Mental health support\n• Chronic condition management\n\nPlease describe your concern in more detail, or ask about a specific health topic.\n\n⚠️ For medical emergencies, please contact your local emergency services immediately.';
            }
          }
        }
      } else {
        // No OpenAI key configured - use static responses
        const lowerMsg = message.toLowerCase();

        // Try enhanced responses first
        const enhancedResponse = getEnhancedResponse(message);
        if (enhancedResponse) {
          responseText = enhancedResponse;
        } else {
          // Check symptom-specific responses
          const matchedSymptom = Object.keys(symptomResponses).find((key) =>
            lowerMsg.includes(key)
          );

          if (matchedSymptom) {
            responseText = symptomResponses[matchedSymptom];
          } else {
            responseText =
              '🏥 **Health Assistant Ready!**\n\nI can help you with:\n• Common symptoms (headache, fever, cold, etc.)\n• Diet and nutrition advice\n• Exercise and fitness tips\n• Stress and mental health\n• Chronic conditions (diabetes, blood pressure)\n• General wellness guidance\n\nWhat would you like to know about? Feel free to ask specific questions!';
          }
        }
      }
    }

    // Add bot response
    session.messages.push({ role: 'assistant', content: responseText, botType });
    await session.save();

    res.json({
      success: true,
      response: responseText,
      sessionId: session._id,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get chat history
// @route   GET /api/chatbot/sessions
// @access  Private
export const getChatSessions = async (req, res) => {
  try {
    const { botType } = req.query;
    const filter = { user: req.user._id };
    if (botType) filter.botType = botType;

    const sessions = await ChatSession.find(filter)
      .sort({ updatedAt: -1 })
      .select('title botType createdAt updatedAt');

    res.json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get messages from a session
// @route   GET /api/chatbot/sessions/:sessionId
// @access  Private
export const getSessionMessages = async (req, res) => {
  try {
    const session = await ChatSession.findOne({
      _id: req.params.sessionId,
      user: req.user._id,
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Chat session not found' });
    }

    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete chat session
// @route   DELETE /api/chatbot/sessions/:sessionId
// @access  Private
export const deleteSession = async (req, res) => {
  try {
    await ChatSession.findOneAndDelete({
      _id: req.params.sessionId,
      user: req.user._id,
    });
    res.json({ success: true, message: 'Chat session deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Explain one medication using openFDA + RxNav + detect interactions with user's profile meds
// @route   POST /api/chatbot/explain-medicine
// @access  Private
export const explainMedicine = async (req, res) => {
  try {
    const { name, userMedications = [] } = req.body || {};
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        status: 'bad-request',
        message: 'Provide a medication name.',
      });
    }

    const cleanName = name.trim();

    // Run RxNav + openFDA in parallel — RxNav normalizes the name, openFDA
    // fetches the authoritative drug label. If either fails we still try
    // to respond with whatever we have.
    const [norm, fdaResult] = await Promise.all([
      normalizeDrug(cleanName).catch(() => null),
      searchDrugInfo(cleanName).catch(() => ({ found: false })),
    ]);

    // Get drug class (best-effort) — only if we got an RxCUI
    const classes = norm?.rxcui ? await getDrugClass(norm.rxcui).catch(() => []) : [];
    const drugClass =
      (classes.find((c) => c.classType === 'ATC1-4') || classes[0])?.className || null;

    // If openFDA has nothing and RxNav also didn't normalize, we're stuck
    if (!fdaResult?.found && !norm) {
      return res.json({
        success: false,
        status: 'not-found',
        name: cleanName,
        message: `I couldn't find authoritative information for "${cleanName}". Please double-check the spelling.`,
        disclaimer: MEDICINE_DISCLAIMER,
      });
    }

    const fda = fdaResult?.data || null;

    // Detect interactions against user's current meds by keyword-matching the
    // FDA drug_interactions + contraindications text. Imperfect but useful.
    // (Use the RAW label text for the match — cleaning happens after.)
    const interactionText = [fda?.drugInteractions, fda?.contraindications]
      .filter(Boolean)
      .join(' ');
    const safeUserMeds = Array.isArray(userMedications)
      ? userMedications.filter((m) => typeof m === 'string').slice(0, 20)
      : [];
    const interactionMatches = interactionText
      ? matchInteractionsInLabel(interactionText, safeUserMeds)
      : [];

    // Clean FDA label verbosity — strip section refs like "( 5.1 )" and
    // dedupe repeated sentences before sending to the UI.
    const clean = (t) => cleanFdaText(t) || null;

    return res.json({
      success: true,
      status: 'ok',
      medicine: {
        name: fda?.brandName && fda.brandName !== 'N/A' ? fda.brandName : norm?.name || cleanName,
        genericName: fda?.genericName && fda.genericName !== 'N/A' ? fda.genericName : null,
        rxcui: norm?.rxcui || null,
        drugClass,
        uses: clean(fda?.purpose),
        dosage: clean(fda?.dosage),
        sideEffects: clean(fda?.adverseReactions),
        warnings: clean(fda?.warnings),
        interactions: clean(fda?.drugInteractions),
        contraindications: clean(fda?.contraindications),
        matchedInteractions: interactionMatches, // [{ drug, evidence }]
        source: 'US FDA drug label',
      },
      disclaimer: MEDICINE_DISCLAIMER,
    });
  } catch (err) {
    console.error('[explainMedicine] fatal:', err.message);
    if (err.stack) console.error(err.stack);
    return res.status(500).json({
      success: false,
      status: 'error',
      message: 'Something went wrong while looking up that medication.',
      detail: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
};

// @desc    Resolve a city name (or lat/lon) to coordinates via Open-Meteo
// @route   POST /api/chatbot/geocode
// @access  Private
export const geocodeCity = async (req, res) => {
  try {
    const { city, lat, lon } = req.body || {};
    const resolved = await resolveLocation({ city, lat, lon });
    if (!resolved) {
      return res.status(404).json({
        success: false,
        status: 'not-found',
        message: `Could not resolve "${city}". Try a larger nearby city.`,
      });
    }
    return res.json({ success: true, status: 'ok', ...resolved });
  } catch (err) {
    console.error('[geocodeCity] fatal:', err.message);
    return res.status(500).json({ success: false, status: 'error', message: 'Geocoding failed' });
  }
};

/**
 * Map a free-text specialty (from the LLM or user input) to one of our
 * canonical Doctor model enum values. Loose matching — tolerates synonyms.
 */
function canonicalizeSpecialty(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const s = raw.trim().toLowerCase();
  if (!s) return null;
  // direct match
  if (DOCTOR_SPECIALTIES.includes(s)) return s;
  // synonym map
  const synonyms = {
    cardiology: 'cardiologist',
    heart: 'cardiologist',
    cardiac: 'cardiologist',
    endocrinology: 'endocrinologist',
    diabetes: 'endocrinologist',
    diabetologist: 'endocrinologist',
    hormone: 'endocrinologist',
    gp: 'general physician',
    'family doctor': 'general physician',
    physician: 'general physician',
    internist: 'general physician',
    skin: 'dermatologist',
    dermatology: 'dermatologist',
    ortho: 'orthopedic',
    orthopedics: 'orthopedic',
    orthopaedic: 'orthopedic',
    orthopedist: 'orthopedic',
    bone: 'orthopedic',
    neurology: 'neurologist',
    neuro: 'neurologist',
    pediatrics: 'pediatrician',
    paediatric: 'pediatrician',
    child: 'pediatrician',
    obgyn: 'gynecologist',
    'ob/gyn': 'gynecologist',
    gynaecologist: 'gynecologist',
    gynaecology: 'gynecologist',
    obstetrician: 'gynecologist',
    psychiatry: 'psychiatrist',
    mental: 'psychiatrist',
    urology: 'urologist',
    ent: 'ent',
    'ear nose throat': 'ent',
    eye: 'ophthalmologist',
    ophthalmology: 'ophthalmologist',
    gastro: 'gastroenterologist',
    gastroenterology: 'gastroenterologist',
    pulmonology: 'pulmonologist',
    lung: 'pulmonologist',
    oncology: 'oncologist',
    cancer: 'oncologist',
  };
  for (const key of Object.keys(synonyms)) {
    if (s.includes(key)) return synonyms[key];
  }
  // fallback: try singular->plural / istrimming "ist"
  const trimmed = s.replace(/\s+/g, ' ');
  if (DOCTOR_SPECIALTIES.includes(trimmed)) return trimmed;
  return null;
}

// @desc    Find nearby doctors (seeded DB + OSM Overpass fallback)
// @route   POST /api/chatbot/nearby-doctors
// @access  Private
export const nearbyDoctors = async (req, res) => {
  try {
    const { specialty: rawSpecialty, lat, lon, city, radius } = req.body || {};

    const loc = await resolveLocation({ lat, lon, city });
    if (!loc) {
      return res.status(400).json({
        success: false,
        status: 'no-location',
        message: 'Please provide a location (allow GPS or enter a city).',
      });
    }

    const radiusMeters = Math.min(Math.max(parseInt(radius, 10) || 7000, 1000), 25000);
    const canonical = canonicalizeSpecialty(rawSpecialty);

    // 1. Seeded DB query — $geoNear limited by specialty (if recognised)
    const seedQuery = {};
    if (canonical) seedQuery.specialty = canonical;

    let seeded = [];
    try {
      seeded = await Doctor.aggregate([
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [loc.lon, loc.lat] },
            distanceField: 'distanceMeters',
            maxDistance: radiusMeters * 10, // broaden seed search to cover major cities
            spherical: true,
            query: seedQuery,
          },
        },
        { $limit: 8 },
      ]);
    } catch (err) {
      console.warn('[nearbyDoctors] $geoNear failed:', err.message);
      seeded = [];
    }

    const seededNormalized = seeded.map((d) => {
      const [lonC, latC] = d.location?.coordinates || [];
      return {
        _id: String(d._id),
        name: d.name,
        specialty: d.specialty,
        qualifications: d.qualifications || '',
        experienceYears: d.experienceYears ?? null,
        rating: d.rating ?? null,
        reviewCount: d.reviewCount ?? null,
        photo: d.photo || '',
        clinicName: d.clinicName || '',
        address: d.address || {},
        phone: d.phone || '',
        email: d.email || '',
        website: d.website || '',
        location: d.location,
        distanceKm:
          typeof d.distanceMeters === 'number'
            ? Number((d.distanceMeters / 1000).toFixed(2))
            : null,
        googleMapUrl:
          typeof latC === 'number' && typeof lonC === 'number'
            ? `https://www.google.com/maps/search/?api=1&query=${latC},${lonC}`
            : '',
        verified: d.verified ?? true,
        source: 'seed',
      };
    });

    // 2. OSM Overpass fallback — always queried, but used only if we don't have
    //    enough seeded results inside the user's actual requested radius.
    const nearSeed = seededNormalized.filter(
      (d) => typeof d.distanceKm === 'number' && d.distanceKm * 1000 <= radiusMeters
    );

    let osm = [];
    if (nearSeed.length < 4) {
      osm = await findNearbyHealthcare({
        lat: loc.lat,
        lon: loc.lon,
        radius: radiusMeters,
        keyword: canonical && canonical !== 'other' ? canonical : undefined,
        limit: 6,
      });
    }

    // Merge — seeded first (nearest first), then OSM. Dedupe by name.
    const seen = new Set();
    const merged = [...nearSeed, ...seededNormalized.filter((d) => !nearSeed.includes(d)), ...osm]
      .filter((d) => {
        const k = (d.name || '').toLowerCase();
        if (!k || seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .slice(0, 10);

    return res.json({
      success: true,
      status: 'ok',
      location: loc,
      specialty: canonical || (rawSpecialty ? String(rawSpecialty) : 'doctor'),
      radius: radiusMeters,
      doctors: merged,
      sources: {
        seed: nearSeed.length,
        seedBroad: seededNormalized.length - nearSeed.length,
        osm: osm.length,
      },
      disclaimer: DOCTORS_DISCLAIMER,
    });
  } catch (err) {
    console.error('[nearbyDoctors] fatal:', err.message);
    if (err.stack) console.error(err.stack);
    return res.status(500).json({
      success: false,
      status: 'error',
      message: 'Something went wrong while searching for doctors.',
      detail: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
};

// @desc    Analyze an uploaded medical report (PDF/DOCX) with Gemini
// @route   POST /api/chatbot/analyze-report/:reportId
// @access  Private
export const analyzeReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.user._id;
    const result = await analyzeReportById(reportId, userId);
    const statusMap = {
      ok: 200,
      unsupported: 200, // still 200 — UI renders friendly fallback
      empty: 200,
      'ai-unavailable': 200,
      'rate-limited': 200,
      'not-found': 404,
      error: 500,
    };
    const httpStatus = statusMap[result.status] ?? 500;
    return res.status(httpStatus).json({
      success: result.status === 'ok',
      ...result,
    });
  } catch (err) {
    console.error('[analyzeReport] fatal:', err.message);
    if (err.stack) console.error(err.stack);
    return res.status(500).json({
      success: false,
      status: 'error',
      message: 'Something went wrong while analyzing the report.',
      detail: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
};
