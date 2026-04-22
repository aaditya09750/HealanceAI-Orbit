// Healance AI — Body Explorer catalog
//
// Patient-facing anatomy data. Each entry supports:
//   function          — patient-friendly description of the part's role
//   diseases          — common conditions affecting the part
//   symptoms          — red-flag symptoms the user might notice
//   tests             — diagnostic tests commonly ordered
//   prevention        — everyday prevention advice
//   metrics           — a single normal-range reference
//   system            — body system this part belongs to (used by filter + Systems tab)
//   relatedConditions — disease names present in Backend/data/allowedDiseases.json
//                       so we can deep-link into the Symptoms Predictor flow
//   icd10Regions      — relevant ICD-10 top-level codes
//   relatedLinks      — deep-link hints for the frontend to build action buttons

const SYSTEMS = {
  cardiovascular: 'Cardiovascular',
  respiratory: 'Respiratory',
  digestive: 'Digestive',
  nervous: 'Nervous',
  musculoskeletal: 'Musculoskeletal',
  endocrine: 'Endocrine',
  urinary: 'Urinary',
  reproductive: 'Reproductive',
  integumentary: 'Integumentary',
  sensory: 'Sensory',
  immune: 'Immune',
  general: 'General',
};

const bodyPartsData = {
  // ─── Head & neck ───────────────────────────────────────
  Head: {
    function:
      'Houses and protects the brain; carries the sensory organs for sight, hearing, smell, and taste.',
    diseases: ['Migraine', 'Tension-Type Headache', 'Sinusitis', 'Concussion'],
    symptoms: ['Headache', 'Dizziness', 'Facial pain', 'Visual changes'],
    tests: ['CT Scan', 'MRI', 'Neurological Exam'],
    prevention: ['Adequate sleep', 'Hydration', 'Stress management', 'Wear helmets during sports'],
    metrics: 'Cognitive Function: Normal',
    system: 'general',
    relatedConditions: ['Migraine', 'Tension-Type Headache', 'Sinusitis'],
    icd10Regions: ['R51', 'G43', 'J32'],
    relatedLinks: ['predict:symptoms', 'chatbot:health'],
  },
  Brain: {
    function:
      'Controls thought, memory, emotion, movement, the senses, and automatic functions like breathing.',
    diseases: [
      "Alzheimer's Disease",
      'Ischemic Stroke',
      'Migraine',
      'Epilepsy',
      "Parkinson's Disease",
    ],
    symptoms: ['Headache', 'Confusion', 'Vision changes', 'Memory loss', 'Seizures'],
    tests: ['MRI', 'CT Scan', 'EEG', 'Cognitive Assessment'],
    prevention: ['Mental exercises', 'Adequate sleep', 'Healthy diet', 'Regular physical activity'],
    metrics: 'Cognitive Score: Normal',
    system: 'nervous',
    relatedConditions: ['Migraine', 'Ischemic Stroke', 'Epilepsy', "Parkinson's Disease"],
    icd10Regions: ['G00-G99'],
    relatedLinks: ['predict:symptoms', 'chatbot:health'],
  },
  Eyes: {
    function:
      'Primary organs of sight, converting light into electrical signals the brain interprets as images.',
    diseases: [
      'Conjunctivitis',
      'Dry Eye Syndrome',
      'Acute Angle-Closure Glaucoma',
      'Hordeolum (Stye)',
    ],
    symptoms: ['Blurred vision', 'Eye strain', 'Redness', 'Halos around lights'],
    tests: ['Visual Acuity Test', 'Eye Pressure Test', 'Retinal Exam'],
    prevention: ['20-20-20 rule for screens', 'UV-protective sunglasses', 'Regular eye exams'],
    metrics: 'Vision: 20/20',
    system: 'sensory',
    relatedConditions: ['Conjunctivitis', 'Dry Eye Syndrome', 'Acute Angle-Closure Glaucoma'],
    icd10Regions: ['H00-H59'],
    relatedLinks: ['chatbot:health'],
  },
  Ears: {
    function: 'Detect sound, help maintain balance, and process directional hearing.',
    diseases: [
      'Otitis Media',
      'Otitis Externa',
      'Benign Paroxysmal Positional Vertigo',
      'Labyrinthitis',
    ],
    symptoms: ['Ear pain', 'Hearing loss', 'Ringing (tinnitus)', 'Vertigo'],
    tests: ['Otoscopy', 'Hearing Test (Audiometry)', 'Tympanometry'],
    prevention: ['Keep ears dry', 'Avoid cotton swabs', 'Use ear protection around loud noise'],
    metrics: 'Hearing Threshold: Normal',
    system: 'sensory',
    relatedConditions: ['Otitis Media', 'Otitis Externa', 'Benign Paroxysmal Positional Vertigo'],
    icd10Regions: ['H60-H95'],
    relatedLinks: ['chatbot:health'],
  },
  'Mouth & Throat': {
    function: 'The entry point for food and air; supports speech, taste, and swallowing.',
    diseases: ['Pharyngitis', 'Tonsillitis', 'Laryngitis', 'Dental Caries'],
    symptoms: ['Sore throat', 'Difficulty swallowing', 'Hoarseness', 'Mouth ulcers'],
    tests: ['Throat Swab', 'Rapid Strep Test', 'Laryngoscopy'],
    prevention: ['Good oral hygiene', 'Adequate hydration', 'Avoid smoking and excess alcohol'],
    metrics: 'Throat Culture: Negative',
    system: 'respiratory',
    relatedConditions: ['Pharyngitis', 'Tonsillitis', 'Laryngitis'],
    icd10Regions: ['J00-J06', 'K00-K14'],
    relatedLinks: ['predict:symptoms'],
  },
  Neck: {
    function:
      'Supports the head and houses the airway, oesophagus, thyroid and major blood vessels.',
    diseases: ['Cervical Spondylosis', 'Thyroid Disorders', 'Swollen Lymph Nodes', 'Whiplash'],
    symptoms: [
      'Neck stiffness',
      'Pain with movement',
      'Swollen glands',
      'Radiating pain to shoulder',
    ],
    tests: ['Cervical X-ray', 'Ultrasound (thyroid/lymph)', 'MRI'],
    prevention: ['Ergonomic workstation', 'Neck stretches', 'Good sleep posture'],
    metrics: 'Cervical Range: Normal',
    system: 'musculoskeletal',
    relatedConditions: ['Hyperthyroidism', 'Hypothyroidism'],
    icd10Regions: ['M54.2', 'E00-E07'],
    relatedLinks: ['chatbot:health'],
  },

  // ─── Chest / thorax ────────────────────────────────────
  Chest: {
    function: 'Protects the heart and lungs; ribs and respiratory muscles drive breathing.',
    diseases: ['Costochondritis', 'Pneumonia', 'Pleurisy', 'Pulmonary Embolism'],
    symptoms: ['Chest pain', 'Difficulty breathing', 'Tenderness to touch'],
    tests: ['Chest X-ray', 'CT Scan', 'ECG'],
    prevention: ['Good posture', 'Breathing exercises', 'Regular checkups'],
    metrics: 'Respiratory Rate: 12-20 bpm',
    system: 'respiratory',
    relatedConditions: ['Pneumonia', 'Acute Bronchitis', 'Pulmonary Embolism'],
    icd10Regions: ['J00-J99'],
    relatedLinks: ['predict:symptoms', 'chatbot:health'],
  },
  Heart: {
    function:
      'Pumps blood throughout the body, supplying oxygen and nutrients to tissues and removing waste products.',
    diseases: [
      'Myocardial Infarction (Heart Attack)',
      'Angina Pectoris',
      'Heart Failure',
      'Atrial Fibrillation',
    ],
    symptoms: ['Chest pain', 'Shortness of breath', 'Fatigue', 'Palpitations', 'Swelling in legs'],
    tests: ['ECG', 'Echocardiogram', 'Stress Test', 'Cardiac Catheterization'],
    prevention: ['Regular cardio exercise', 'Low-sodium diet', 'Stress management', 'No smoking'],
    metrics: 'Resting Heart Rate: 60-100 bpm',
    system: 'cardiovascular',
    relatedConditions: [
      'Myocardial Infarction (Heart Attack)',
      'Angina Pectoris',
      'Heart Failure',
      'Hypertension',
    ],
    icd10Regions: ['I20-I52'],
    relatedLinks: ['predict:heart-diabetes', 'predict:symptoms', 'chatbot:health'],
  },
  Lungs: {
    function: 'Exchange oxygen and carbon dioxide between the air and the blood with every breath.',
    diseases: [
      'Asthma',
      'Chronic Obstructive Pulmonary Disease (COPD)',
      'Pneumonia',
      'Tuberculosis',
    ],
    symptoms: ['Coughing', 'Wheezing', 'Chest tightness', 'Shortness of breath', 'Blood in sputum'],
    tests: ['Spirometry', 'Chest X-ray', 'CT Scan', 'Pulse Oximetry'],
    prevention: [
      'Avoid smoking',
      'Air quality awareness',
      'Breathing exercises',
      'Flu & pneumococcal vaccines',
    ],
    metrics: 'SpO2: 95-100%',
    system: 'respiratory',
    relatedConditions: [
      'Asthma',
      'Chronic Obstructive Pulmonary Disease (COPD)',
      'Pneumonia',
      'Tuberculosis',
    ],
    icd10Regions: ['J40-J47'],
    relatedLinks: ['predict:symptoms', 'chatbot:health'],
  },

  // ─── Digestive ────────────────────────────────────────
  Stomach: {
    function:
      'Breaks down food with acid and enzymes so nutrients can be absorbed downstream in the intestines.',
    diseases: ['Gastritis', 'Gastroesophageal Reflux Disease (GERD)', 'Peptic Ulcer Disease'],
    symptoms: ['Abdominal pain', 'Bloating', 'Nausea', 'Heartburn', 'Loss of appetite'],
    tests: ['Endoscopy', 'H. pylori Test', 'Barium Swallow', 'Abdominal Ultrasound'],
    prevention: ['Balanced diet', 'Smaller frequent meals', 'Limit alcohol', 'Manage stress'],
    metrics: 'Gastric pH: 1.5-3.5',
    system: 'digestive',
    relatedConditions: [
      'Gastritis',
      'Gastroesophageal Reflux Disease (GERD)',
      'Peptic Ulcer Disease',
    ],
    icd10Regions: ['K20-K31'],
    relatedLinks: ['predict:symptoms', 'chatbot:health'],
  },
  Liver: {
    function:
      'Processes nutrients, filters toxins from blood, makes bile for digestion, and stores vitamins.',
    diseases: ['Hepatitis A', 'Hepatitis B', 'Hepatitis C', 'Jaundice', 'Pancreatitis'],
    symptoms: ['Jaundice', 'Fatigue', 'Abdominal swelling', 'Dark urine', 'Nausea'],
    tests: ['Liver Function Test (LFT)', 'Ultrasound', 'Fibroscan', 'CT Scan'],
    prevention: [
      'Limit alcohol',
      'Maintain healthy weight',
      'Hepatitis vaccination',
      'Avoid toxins',
    ],
    metrics: 'ALT/AST: Normal',
    system: 'digestive',
    relatedConditions: ['Hepatitis A', 'Hepatitis B', 'Hepatitis C', 'Jaundice'],
    icd10Regions: ['K70-K77'],
    relatedLinks: ['predict:symptoms', 'chatbot:health'],
  },
  Pancreas: {
    function: 'Produces insulin to control blood sugar and digestive enzymes that break down food.',
    diseases: [
      'Type 1 Diabetes Mellitus',
      'Type 2 Diabetes Mellitus',
      'Pancreatitis',
      'Diabetic Ketoacidosis (DKA)',
    ],
    symptoms: [
      'Frequent thirst',
      'Frequent urination',
      'Unexplained weight loss',
      'Severe upper abdominal pain',
    ],
    tests: ['Fasting Glucose', 'HbA1c', 'Abdominal CT', 'Amylase/Lipase'],
    prevention: ['Healthy weight', 'Avoid heavy alcohol', 'Regular exercise', 'Balanced diet'],
    metrics: 'Fasting Glucose: 70-99 mg/dL',
    system: 'endocrine',
    relatedConditions: ['Type 2 Diabetes Mellitus', 'Type 1 Diabetes Mellitus', 'Pancreatitis'],
    icd10Regions: ['E10-E14', 'K85-K86'],
    relatedLinks: ['predict:heart-diabetes', 'chatbot:health'],
  },
  Gallbladder: {
    function: 'Stores and releases bile made by the liver to help digest fats.',
    diseases: ['Cholecystitis', 'Gallstones', 'Biliary Colic'],
    symptoms: ['Right-upper abdominal pain after fatty meals', 'Nausea', 'Fever', 'Bloating'],
    tests: ['Abdominal Ultrasound', 'HIDA Scan', 'MRCP'],
    prevention: ['Maintain healthy weight', 'Limit high-fat meals', 'Regular exercise'],
    metrics: 'Bile Flow: Normal',
    system: 'digestive',
    relatedConditions: ['Cholecystitis'],
    icd10Regions: ['K80-K83'],
    relatedLinks: ['chatbot:health'],
  },
  'Small Intestine': {
    function: 'Absorbs most of the nutrients from digested food into the bloodstream.',
    diseases: ['Celiac Disease', 'Crohn’s Disease', 'Small Intestinal Bacterial Overgrowth'],
    symptoms: ['Chronic diarrhoea', 'Bloating', 'Weight loss', 'Abdominal pain after meals'],
    tests: ['Celiac Panel', 'Endoscopy', 'Capsule Endoscopy'],
    prevention: ['Balanced diet', 'Avoid unsafe water and food', 'Manage food triggers if present'],
    metrics: 'Nutrient Absorption: Normal',
    system: 'digestive',
    relatedConditions: ['Inflammatory Bowel Disease (IBD)', 'Irritable Bowel Syndrome (IBS)'],
    icd10Regions: ['K90'],
    relatedLinks: ['predict:symptoms', 'chatbot:health'],
  },
  'Large Intestine': {
    function:
      'Absorbs water, forms stool, and houses gut bacteria that support digestion and immunity.',
    diseases: [
      'Irritable Bowel Syndrome (IBS)',
      'Inflammatory Bowel Disease (IBD)',
      'Diverticulitis',
      'Colorectal Cancer Warning Signs',
    ],
    symptoms: ['Diarrhoea', 'Constipation', 'Abdominal cramps', 'Blood in stool'],
    tests: ['Colonoscopy', 'Stool Tests', 'CT Abdomen'],
    prevention: [
      'High-fibre diet',
      'Adequate fluids',
      'Regular screening after age 45',
      'Regular exercise',
    ],
    metrics: 'Bowel Habit: 1-2 times/day',
    system: 'digestive',
    relatedConditions: [
      'Irritable Bowel Syndrome (IBS)',
      'Inflammatory Bowel Disease (IBD)',
      'Diverticulitis',
      'Hemorrhoids',
    ],
    icd10Regions: ['K50-K64'],
    relatedLinks: ['predict:symptoms', 'chatbot:health'],
  },

  // ─── Urinary ─────────────────────────────────────────
  Kidneys: {
    function:
      'Filter blood to remove waste, balance body fluids, regulate blood pressure, and produce hormones.',
    diseases: ['Kidney Stones', 'Acute Kidney Injury', 'Chronic Kidney Disease', 'Pyelonephritis'],
    symptoms: ['Flank pain', 'Frequent urination', 'Blood in urine', 'Fatigue', 'Swelling'],
    tests: ['Kidney Function Test', 'Urinalysis', 'Ultrasound', 'CT Scan', 'GFR Test'],
    prevention: [
      'Adequate water intake',
      'Low-sodium diet',
      'Control blood sugar',
      'Avoid NSAID overuse',
    ],
    metrics: 'GFR: >90 mL/min',
    system: 'urinary',
    relatedConditions: [
      'Kidney Stones',
      'Chronic Kidney Disease',
      'Acute Kidney Injury',
      'Pyelonephritis',
    ],
    icd10Regions: ['N00-N29'],
    relatedLinks: ['predict:symptoms', 'chatbot:health'],
  },
  Bladder: {
    function: 'Stores urine from the kidneys until it can be passed out through the urethra.',
    diseases: [
      'Urinary Tract Infection',
      'Urinary Incontinence',
      'Bladder Stones',
      'Overactive Bladder',
    ],
    symptoms: ['Burning on urination', 'Frequency', 'Urgency', 'Incontinence'],
    tests: ['Urinalysis', 'Cystoscopy', 'Urodynamics'],
    prevention: ['Stay hydrated', 'Don’t hold urine too long', 'Pelvic floor exercises'],
    metrics: 'Capacity: 400-600 mL',
    system: 'urinary',
    relatedConditions: [
      'Urinary Tract Infection',
      'Urinary Incontinence',
      'Benign Prostatic Hyperplasia',
    ],
    icd10Regions: ['N30-N39'],
    relatedLinks: ['predict:symptoms', 'chatbot:health'],
  },

  // ─── Endocrine ───────────────────────────────────────
  Thyroid: {
    function: 'Produces hormones that regulate metabolism, heart rate, temperature and energy use.',
    diseases: ['Hyperthyroidism', 'Hypothyroidism', 'Goitre', 'Thyroid Nodule'],
    symptoms: [
      'Unexplained weight change',
      'Heat/cold intolerance',
      'Fatigue',
      'Palpitations',
      'Neck swelling',
    ],
    tests: ['TSH', 'Free T4 / Free T3', 'Thyroid Ultrasound'],
    prevention: [
      'Adequate iodine intake',
      'Routine screening if family history',
      'Annual checkups after 50',
    ],
    metrics: 'TSH: 0.4-4.0 mIU/L',
    system: 'endocrine',
    relatedConditions: ['Hypothyroidism', 'Hyperthyroidism'],
    icd10Regions: ['E00-E07'],
    relatedLinks: ['chatbot:health'],
  },
  'Adrenal Glands': {
    function:
      'Small glands on top of the kidneys that make cortisol, adrenaline, and sex hormone precursors.',
    diseases: ["Addison's Disease", "Cushing's Syndrome", 'Adrenal Insufficiency'],
    symptoms: [
      'Fatigue',
      'Low blood pressure',
      'Skin darkening',
      'Weight changes',
      'Salt cravings',
    ],
    tests: ['AM Cortisol', 'ACTH Stimulation Test', 'Adrenal CT/MRI'],
    prevention: [
      'Stress management',
      'Never stop steroids abruptly',
      'Regular endocrinology follow-up if on treatment',
    ],
    metrics: 'Morning Cortisol: 10-20 µg/dL',
    system: 'endocrine',
    relatedConditions: ["Addison's Disease", "Cushing's Syndrome"],
    icd10Regions: ['E27'],
    relatedLinks: ['chatbot:health'],
  },

  // ─── Reproductive (symbolically placed; UI does not render gendered models) ───
  Ovaries: {
    function: 'Produce eggs and the female sex hormones oestrogen and progesterone.',
    diseases: ['Polycystic Ovary Syndrome', 'Ovarian Cysts', 'Endometriosis'],
    symptoms: ['Irregular periods', 'Pelvic pain', 'Hirsutism', 'Acne', 'Difficulty conceiving'],
    tests: ['Pelvic Ultrasound', 'Hormone Panel (LH, FSH, Androgens)'],
    prevention: ['Healthy weight', 'Regular gynaecology checkups', 'Balanced diet'],
    metrics: 'AMH: Age-appropriate',
    system: 'reproductive',
    relatedConditions: ['Polycystic Ovary Syndrome', 'Endometriosis', 'Primary Dysmenorrhea'],
    icd10Regions: ['N80-N98'],
    relatedLinks: ['chatbot:health'],
    onlyFor: 'female',
  },
  Uterus: {
    function:
      'Muscular organ that holds and nourishes a pregnancy; sheds its lining during menstruation.',
    diseases: ['Uterine Fibroids', 'Endometriosis', 'Primary Dysmenorrhea', 'Menopausal Syndrome'],
    symptoms: ['Heavy periods', 'Severe cramping', 'Pelvic pressure', 'Irregular bleeding'],
    tests: ['Pelvic Ultrasound', 'MRI Pelvis', 'Endometrial Biopsy'],
    prevention: ['Routine gynaecology checkups', 'Track cycles', 'Balanced diet and exercise'],
    metrics: 'Cycle Length: 24-35 days',
    system: 'reproductive',
    relatedConditions: ['Uterine Fibroids', 'Endometriosis', 'Primary Dysmenorrhea'],
    icd10Regions: ['N80-N98'],
    relatedLinks: ['chatbot:health'],
    onlyFor: 'female',
  },
  Prostate: {
    function: 'Small gland that sits below the bladder in men and contributes fluid to semen.',
    diseases: ['Benign Prostatic Hyperplasia', 'Prostatitis', 'Prostate Cancer Warning Signs'],
    symptoms: [
      'Weak urinary stream',
      'Urinary frequency',
      'Nocturia',
      'Incomplete bladder emptying',
    ],
    tests: ['Digital Rectal Exam', 'PSA Test', 'Uroflowmetry'],
    prevention: ['Routine screening after 50', 'Healthy diet', 'Regular exercise'],
    metrics: 'PSA: Age-appropriate',
    system: 'reproductive',
    relatedConditions: ['Benign Prostatic Hyperplasia'],
    icd10Regions: ['N40'],
    relatedLinks: ['chatbot:health'],
    onlyFor: 'male',
  },

  // ─── Musculoskeletal ─────────────────────────────────
  Spine: {
    function:
      'Column of vertebrae that protects the spinal cord and supports the weight of the upper body.',
    diseases: ['Lower Back Pain', 'Sciatica', 'Osteoporosis', 'Cervical Spondylosis'],
    symptoms: ['Back pain', 'Numbness in limbs', 'Stiffness', 'Tingling'],
    tests: ['X-ray', 'MRI', 'CT Scan', 'Bone Density (DEXA)'],
    prevention: [
      'Good posture',
      'Core strengthening',
      'Ergonomic workstation',
      'Regular stretching',
    ],
    metrics: 'Spinal Alignment: Normal',
    system: 'musculoskeletal',
    relatedConditions: ['Lower Back Pain', 'Sciatica', 'Osteoporosis'],
    icd10Regions: ['M40-M54'],
    relatedLinks: ['predict:symptoms', 'chatbot:health'],
  },
  Shoulders: {
    function: 'Provide joint mobility and support arm rotation and lifting.',
    diseases: ['Rotator Cuff Injury', 'Bursitis', 'Frozen Shoulder', 'Tendinitis'],
    symptoms: ['Shoulder pain', 'Stiffness', 'Reduced arm movement'],
    tests: ['Shoulder X-ray', 'MRI', 'Range of Motion Test'],
    prevention: ['Posture correction', 'Strength training', 'Avoid overuse injuries'],
    metrics: 'Mobility: Functional',
    system: 'musculoskeletal',
    relatedConditions: ['Tendinitis', 'Rheumatoid Arthritis'],
    icd10Regions: ['M75'],
    relatedLinks: ['chatbot:health'],
  },
  'Left Arm': {
    function:
      'Used for grasping, lifting, and manipulating objects. Contains bones, muscles, nerves, and blood vessels.',
    diseases: ['Tennis Elbow', 'Fractures', 'Rheumatoid Arthritis'],
    symptoms: ['Pain', 'Numbness', 'Weakness', 'Swelling'],
    tests: ['X-ray', 'EMG', 'Nerve Conduction Study', 'MRI'],
    prevention: ['Proper ergonomics', 'Regular stretching', 'Strength training'],
    metrics: 'Grip Strength: Normal',
    system: 'musculoskeletal',
    relatedConditions: ['Rheumatoid Arthritis', 'Tendinitis'],
    icd10Regions: ['M70-M79'],
    relatedLinks: ['chatbot:health'],
  },
  'Right Arm': {
    function:
      'Used for grasping, lifting, and manipulating objects. Contains bones, muscles, nerves, and blood vessels.',
    diseases: ['Tennis Elbow', 'Fractures', 'Rheumatoid Arthritis'],
    symptoms: ['Pain', 'Numbness', 'Weakness', 'Swelling'],
    tests: ['X-ray', 'EMG', 'Nerve Conduction Study', 'MRI'],
    prevention: ['Proper ergonomics', 'Regular stretching', 'Strength training'],
    metrics: 'Grip Strength: Normal',
    system: 'musculoskeletal',
    relatedConditions: ['Rheumatoid Arthritis', 'Tendinitis'],
    icd10Regions: ['M70-M79'],
    relatedLinks: ['chatbot:health'],
  },
  Hands: {
    function: 'Enable grip, touch sensing, and fine motor movements.',
    diseases: ['Carpal Tunnel Syndrome', 'Osteoarthritis', 'Trigger Finger'],
    symptoms: ['Numbness', 'Weak grip', 'Joint pain', 'Swollen finger joints'],
    tests: ['Nerve Conduction Study', 'X-ray', 'Grip Strength Test'],
    prevention: ['Ergonomic posture', 'Hand stretches', 'Frequent typing breaks'],
    metrics: 'Grip Strength: Normal',
    system: 'musculoskeletal',
    relatedConditions: ['Osteoarthritis', 'Rheumatoid Arthritis'],
    icd10Regions: ['M70-M79'],
    relatedLinks: ['chatbot:health'],
  },
  'Hip & Pelvis': {
    function:
      'Bears the weight of the upper body and connects the spine to the legs through powerful ball-and-socket joints.',
    diseases: ['Osteoarthritis', 'Hip Fracture', 'Bursitis'],
    symptoms: [
      'Groin pain',
      'Reduced walking distance',
      'Stiffness',
      'Difficulty sitting cross-legged',
    ],
    tests: ['Hip X-ray', 'MRI', 'DEXA scan'],
    prevention: ['Strength training', 'Fall prevention', 'Healthy weight'],
    metrics: 'Hip Mobility: Normal',
    system: 'musculoskeletal',
    relatedConditions: ['Osteoarthritis', 'Osteoporosis'],
    icd10Regions: ['M16'],
    relatedLinks: ['chatbot:health'],
  },
  'Left Leg': {
    function:
      'Supports body weight, enables locomotion and balance. Contains large bones, muscles, and joints.',
    diseases: ['Deep Vein Thrombosis (DVT)', 'Varicose Veins', 'Osteoarthritis'],
    symptoms: ['Pain', 'Swelling', 'Cramping', 'Numbness', 'Difficulty walking'],
    tests: ['X-ray', 'Doppler Ultrasound', 'MRI'],
    prevention: ['Regular exercise', 'Proper footwear', 'Stretching', 'Maintain healthy weight'],
    metrics: 'Range of Motion: Normal',
    system: 'musculoskeletal',
    relatedConditions: ['Deep Vein Thrombosis (DVT)', 'Osteoarthritis'],
    icd10Regions: ['M70-M79'],
    relatedLinks: ['chatbot:health'],
  },
  'Right Leg': {
    function:
      'Supports body weight, enables locomotion and balance. Contains large bones, muscles, and joints.',
    diseases: ['Deep Vein Thrombosis (DVT)', 'Varicose Veins', 'Osteoarthritis'],
    symptoms: ['Pain', 'Swelling', 'Cramping', 'Numbness', 'Difficulty walking'],
    tests: ['X-ray', 'Doppler Ultrasound', 'MRI'],
    prevention: ['Regular exercise', 'Proper footwear', 'Stretching', 'Maintain healthy weight'],
    metrics: 'Range of Motion: Normal',
    system: 'musculoskeletal',
    relatedConditions: ['Deep Vein Thrombosis (DVT)', 'Osteoarthritis'],
    icd10Regions: ['M70-M79'],
    relatedLinks: ['chatbot:health'],
  },
  Knees: {
    function: 'Hinge joints that support body weight during walking, running, and standing.',
    diseases: ['Osteoarthritis', 'Meniscus Tear', 'ACL Injury', 'Patellar Tendinitis'],
    symptoms: ['Knee pain', 'Swelling', 'Locking or giving way', 'Stiffness'],
    tests: ['Knee X-ray', 'MRI', 'Arthroscopy'],
    prevention: ['Quadriceps strengthening', 'Low-impact exercise', 'Healthy weight'],
    metrics: 'Knee Flexion: 0-140°',
    system: 'musculoskeletal',
    relatedConditions: ['Osteoarthritis', 'Tendinitis'],
    icd10Regions: ['M17'],
    relatedLinks: ['chatbot:health'],
  },
  Feet: {
    function: 'Maintain balance, absorb shock, and support movement.',
    diseases: ['Plantar Fasciitis', 'Flat Foot', 'Diabetic Foot', 'Gout'],
    symptoms: ['Heel pain', 'Burning sensation', 'Swelling', 'Numbness'],
    tests: ['Foot Pressure Analysis', 'X-ray', 'Neuropathy Screening'],
    prevention: ['Supportive footwear', 'Foot hygiene', 'Stretching', 'Blood sugar control'],
    metrics: 'Pressure Pattern: Balanced',
    system: 'musculoskeletal',
    relatedConditions: ['Gout', 'Peripheral Neuropathy'],
    icd10Regions: ['M79'],
    relatedLinks: ['chatbot:health'],
  },

  // ─── Skin & immune ───────────────────────────────────
  Skin: {
    function:
      'The body’s largest organ — barrier against infection, regulator of temperature, and primary sense of touch.',
    diseases: [
      'Atopic Dermatitis (Eczema)',
      'Psoriasis',
      'Acne Vulgaris',
      'Skin Cancer Warning Signs (Melanoma)',
    ],
    symptoms: ['Rash', 'Itching', 'Dry patches', 'New or changing moles'],
    tests: ['Skin Biopsy', 'Dermoscopy', 'Patch Test'],
    prevention: [
      'Daily sunscreen SPF 30+',
      'Moisturise daily',
      'Avoid harsh chemicals',
      'Monthly self skin check',
    ],
    metrics: 'Skin Integrity: Normal',
    system: 'integumentary',
    relatedConditions: ['Atopic Dermatitis (Eczema)', 'Psoriasis', 'Acne Vulgaris'],
    icd10Regions: ['L00-L99'],
    relatedLinks: ['chatbot:health'],
  },
  'Lymphatic System': {
    function:
      'Network of nodes and vessels that supports immunity and drains excess fluid from tissues.',
    diseases: ['Lymphadenitis', 'Infectious Mononucleosis', 'Lymphoedema'],
    symptoms: ['Swollen lymph nodes', 'Fatigue', 'Fever', 'Swelling in a limb'],
    tests: ['Complete Blood Count', 'Ultrasound', 'Lymph Node Biopsy'],
    prevention: [
      'Treat infections early',
      'Maintain healthy weight',
      'Manage chronic inflammation',
    ],
    metrics: 'Lymph Node: Non-tender',
    system: 'immune',
    relatedConditions: ['Infectious Mononucleosis'],
    icd10Regions: ['I88', 'I89'],
    relatedLinks: ['chatbot:health'],
  },
};

const searchMatches = (partName, entry, query) => {
  const q = String(query).trim().toLowerCase();
  if (!q) return true;
  if (partName.toLowerCase().includes(q)) return true;
  const haystacks = [
    entry.function,
    ...(entry.diseases || []),
    ...(entry.symptoms || []),
    ...(entry.relatedConditions || []),
  ];
  return haystacks.some((h) => String(h).toLowerCase().includes(q));
};

// @desc    Get all body parts, with optional ?search= and ?system= filters
// @route   GET /api/body-explorer
// @access  Public
export const getAllBodyParts = (req, res) => {
  const { search, system, gender } = req.query || {};
  const entries = Object.entries(bodyPartsData);

  const filtered = entries.filter(([name, entry]) => {
    if (gender && entry.onlyFor && entry.onlyFor !== gender) return false;
    if (system && entry.system !== system) return false;
    if (search && !searchMatches(name, entry, search)) return false;
    return true;
  });

  const data = Object.fromEntries(filtered);
  res.json({
    success: true,
    data,
    totalParts: Object.keys(data).length,
  });
};

// @desc    Get specific body part info
// @route   GET /api/body-explorer/:partName
// @access  Public
export const getBodyPartInfo = (req, res) => {
  const partName = req.params.partName;
  const partInfo = bodyPartsData[partName];

  if (!partInfo) {
    return res.json({
      success: true,
      data: {
        function: 'Essential body part maintaining structural or physiological integrity.',
        diseases: ['Infection', 'Inflammation', 'Trauma'],
        symptoms: ['Pain', 'Swelling', 'Redness'],
        tests: ['Physical Exam', 'Imaging'],
        prevention: ['Regular checkups', 'Healthy lifestyle'],
        metrics: 'Status: Healthy',
        system: 'general',
        relatedConditions: [],
        icd10Regions: [],
        relatedLinks: [],
      },
      partName,
    });
  }

  res.json({ success: true, data: partInfo, partName });
};

// @desc    List distinct body systems (for filter UI)
// @route   GET /api/body-explorer/meta/systems
// @access  Public
export const listSystems = (_req, res) => {
  const used = new Set(Object.values(bodyPartsData).map((p) => p.system));
  const systems = Object.entries(SYSTEMS)
    .filter(([id]) => used.has(id))
    .map(([id, label]) => ({ id, label }));
  res.json({ success: true, systems });
};
