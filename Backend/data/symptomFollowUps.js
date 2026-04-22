/**
 * Static catalog of follow-up questions per symptom. Keys match the
 * SYMPTOM_LABELS keys used by the frontend RiskPrediction page and the
 * `symptomFeatures` array in predictController.js.
 *
 * Each question has:
 *   id         — stable snake_case identifier (also used in contextualAnswers)
 *   symptom    — injected automatically by the generator when folding in
 *   label      — human-readable question text
 *   type       — 'chip' | 'number' | 'multiselect'
 *   options    — for chip/multiselect: array of display strings
 *   unit       — for number: unit suffix (e.g. '°F', 'per day')
 *   min, max   — for number: validation bounds
 *   required   — true if the question must be answered (or explicit "I'm not sure")
 *   priority   — higher is more important (used by generator to cap at 6)
 *   redFlag    — true marks clinically urgent questions; always included
 *                regardless of the 6-item cap, and answering "Yes" triggers
 *                the inline urgent-care advisory banner in the UI.
 *
 * SHARED_QUESTIONS are folded in once per session regardless of which
 * symptoms are selected (deduped by id).
 *
 * Version is exposed as `CATALOG_VERSION` and returned in every API
 * response so we can evolve the catalog without breaking cached clients.
 */

export const CATALOG_VERSION = '1.0.0';

export const SYMPTOM_FOLLOWUPS = {
  fever: [
    {
      id: 'fever_temp_f',
      label: 'Highest temperature recorded?',
      type: 'number',
      unit: '°F',
      min: 95,
      max: 110,
      required: true,
      priority: 10,
      helpText: 'Enter your highest reading in the last 24 hours.',
    },
    {
      id: 'fever_duration_days',
      label: 'How many days has the fever lasted?',
      type: 'chip',
      options: ['<1', '1-3', '4-7', '>7'],
      required: true,
      priority: 9,
    },
    {
      id: 'fever_pattern',
      label: 'Fever pattern',
      type: 'chip',
      options: ['Constant', 'Comes and goes', 'Worse at night'],
      priority: 6,
    },
    {
      id: 'fever_chills',
      label: 'Any chills or shivering?',
      type: 'chip',
      options: ['Yes', 'No'],
      priority: 5,
    },
  ],

  cough: [
    {
      id: 'cough_type',
      label: 'Is the cough dry or with mucus?',
      type: 'chip',
      options: ['Dry', 'With mucus', 'Mix of both'],
      required: true,
      priority: 9,
    },
    {
      id: 'cough_duration_days',
      label: 'How long have you been coughing?',
      type: 'chip',
      options: ['<3 days', '3-7 days', '1-3 weeks', '>3 weeks'],
      priority: 8,
    },
    {
      id: 'cough_blood',
      label: 'Any blood in cough?',
      type: 'chip',
      options: ['Yes', 'No'],
      required: true,
      priority: 10,
      redFlag: true,
    },
  ],

  headache: [
    {
      id: 'headache_severity',
      label: 'How severe is the headache?',
      type: 'chip',
      options: ['Mild', 'Moderate', 'Severe', 'Worst ever'],
      required: true,
      priority: 9,
    },
    {
      id: 'headache_location',
      label: 'Where is the pain?',
      type: 'chip',
      options: ['Forehead', 'One side', 'Back of head', 'All over'],
      priority: 6,
    },
    {
      id: 'headache_sudden',
      label: 'Did it start suddenly (thunderclap)?',
      type: 'chip',
      options: ['Yes', 'No'],
      required: true,
      priority: 10,
      redFlag: true,
    },
  ],

  fatigue: [
    {
      id: 'fatigue_duration',
      label: 'How long have you felt fatigued?',
      type: 'chip',
      options: ['<3 days', '3-7 days', '1-4 weeks', '>1 month'],
      required: true,
      priority: 8,
    },
    {
      id: 'fatigue_sleep_hours',
      label: 'Average sleep per night?',
      type: 'number',
      unit: 'hours',
      min: 0,
      max: 16,
      priority: 6,
    },
  ],

  vomiting: [
    {
      id: 'vomiting_frequency_per_day',
      label: 'Episodes of vomiting in the last 24 hours?',
      type: 'number',
      unit: 'episodes',
      min: 0,
      max: 30,
      required: true,
      priority: 9,
    },
    {
      id: 'vomiting_blood',
      label: 'Any blood in vomit?',
      type: 'chip',
      options: ['Yes', 'No'],
      required: true,
      priority: 10,
      redFlag: true,
    },
    {
      id: 'recent_food',
      label: 'Unusual food or drink in the last 24 hours?',
      type: 'multiselect',
      options: ['Street food', 'Seafood', 'Dairy', 'Leftovers', 'Alcohol', 'None'],
      priority: 7,
    },
  ],

  chest_pain: [
    {
      id: 'chest_pain_character',
      label: 'How does the chest pain feel?',
      type: 'chip',
      options: ['Pressure / squeezing', 'Sharp / stabbing', 'Burning', 'Aching'],
      required: true,
      priority: 10,
    },
    {
      id: 'chest_pain_radiates',
      label: 'Does it radiate to your arm, jaw, or back?',
      type: 'chip',
      options: ['Yes', 'No'],
      required: true,
      priority: 10,
      redFlag: true,
    },
    {
      id: 'chest_pain_trigger',
      label: 'Triggered or worsened by exertion?',
      type: 'chip',
      options: ['Yes', 'No', 'Not sure'],
      priority: 8,
    },
  ],

  sore_throat: [
    {
      id: 'sore_throat_severity',
      label: 'How painful is it to swallow?',
      type: 'chip',
      options: ['Mild', 'Moderate', 'Severe'],
      required: true,
      priority: 8,
    },
    {
      id: 'sore_throat_white_patches',
      label: 'Any white patches or pus in the throat?',
      type: 'chip',
      options: ['Yes', 'No', 'Not sure'],
      priority: 7,
    },
  ],

  breathlessness: [
    {
      id: 'breathlessness_trigger',
      label: 'When does the breathlessness happen?',
      type: 'chip',
      options: ['At rest', 'On mild activity', 'On heavy activity', 'Only at night'],
      required: true,
      priority: 9,
    },
    {
      id: 'breathlessness_severity',
      label: 'How severe is it right now?',
      type: 'chip',
      options: ['Mild', 'Moderate', 'Severe', 'Cannot speak full sentences'],
      required: true,
      priority: 10,
      redFlag: true,
    },
  ],

  nausea: [
    {
      id: 'nausea_duration',
      label: 'How long has the nausea lasted?',
      type: 'chip',
      options: ['<12h', '12-48h', '2-7d', '>1 week'],
      required: true,
      priority: 8,
    },
    {
      id: 'nausea_after_eating',
      label: 'Worse after eating?',
      type: 'chip',
      options: ['Yes', 'No', 'Not sure'],
      priority: 5,
    },
  ],

  dizziness: [
    {
      id: 'dizziness_type',
      label: 'What best describes the dizziness?',
      type: 'chip',
      options: ['Lightheaded', 'Room spinning (vertigo)', 'Unsteady on feet'],
      required: true,
      priority: 9,
    },
    {
      id: 'dizziness_fainting',
      label: 'Any fainting or near-fainting?',
      type: 'chip',
      options: ['Yes', 'No'],
      required: true,
      priority: 10,
      redFlag: true,
    },
  ],

  body_pain: [
    {
      id: 'body_pain_severity',
      label: 'How severe is the body pain?',
      type: 'chip',
      options: ['Mild', 'Moderate', 'Severe'],
      required: true,
      priority: 7,
    },
    {
      id: 'body_pain_joints',
      label: 'Is pain concentrated in joints?',
      type: 'chip',
      options: ['Yes', 'No'],
      priority: 5,
    },
  ],

  diarrhea: [
    {
      id: 'diarrhea_frequency',
      label: 'Loose stools in last 24 hours?',
      type: 'number',
      unit: 'times',
      min: 0,
      max: 30,
      required: true,
      priority: 9,
    },
    {
      id: 'diarrhea_blood',
      label: 'Any blood in stool?',
      type: 'chip',
      options: ['Yes', 'No'],
      required: true,
      priority: 10,
      redFlag: true,
    },
    {
      id: 'diarrhea_dehydration',
      label: 'Any signs of dehydration (dry mouth, dizziness, less urine)?',
      type: 'chip',
      options: ['Yes', 'No'],
      priority: 7,
    },
  ],

  skin_rash: [
    {
      id: 'skin_rash_location',
      label: 'Where is the rash?',
      type: 'multiselect',
      options: ['Face', 'Arms', 'Legs', 'Chest / back', 'All over'],
      required: true,
      priority: 7,
    },
    {
      id: 'skin_rash_itchy',
      label: 'Is it itchy?',
      type: 'chip',
      options: ['Yes', 'No'],
      priority: 5,
    },
    {
      id: 'skin_rash_new_product',
      label: 'New soap, cream, or medication recently?',
      type: 'chip',
      options: ['Yes', 'No'],
      priority: 6,
    },
  ],

  itching: [
    {
      id: 'itching_area',
      label: 'Where is the itching?',
      type: 'multiselect',
      options: ['Scalp', 'Arms', 'Legs', 'Chest / back', 'All over'],
      priority: 6,
    },
    {
      id: 'itching_night',
      label: 'Worse at night?',
      type: 'chip',
      options: ['Yes', 'No'],
      priority: 5,
    },
  ],

  weight_loss: [
    {
      id: 'weight_loss_amount',
      label: 'Approximately how much weight lost?',
      type: 'chip',
      options: ['<2 kg', '2-5 kg', '5-10 kg', '>10 kg'],
      required: true,
      priority: 9,
    },
    {
      id: 'weight_loss_intentional',
      label: 'Was the weight loss intentional?',
      type: 'chip',
      options: ['Yes', 'No'],
      required: true,
      priority: 8,
    },
  ],

  sweating: [
    {
      id: 'sweating_night',
      label: 'Do you have night sweats that soak the bedding?',
      type: 'chip',
      options: ['Yes', 'No'],
      required: true,
      priority: 8,
    },
    {
      id: 'sweating_with_fever',
      label: 'Sweating together with fever or chills?',
      type: 'chip',
      options: ['Yes', 'No'],
      priority: 6,
    },
  ],
};

export const SHARED_QUESTIONS = [
  {
    id: 'general_duration',
    label: 'How long have you felt unwell overall?',
    type: 'chip',
    options: ['<24h', '1-3d', '4-7d', '>1wk'],
    priority: 7,
  },
  {
    id: 'general_travel',
    label: 'Any recent travel (last 14 days)?',
    type: 'chip',
    options: ['No', 'Domestic', 'International'],
    priority: 4,
  },
  {
    id: 'general_known_contact',
    label: 'Known contact with someone sick recently?',
    type: 'chip',
    options: ['Yes', 'No', 'Not sure'],
    priority: 4,
  },
];
