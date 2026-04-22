import RiskPrediction from '../models/RiskPrediction.js';
import Notification from '../models/Notification.js';

// @desc    Analyze health risk
// @route   POST /api/risk-prediction/analyze
// @access  Private
export const analyzeRisk = async (req, res) => {
  try {
    const {
      age,
      gender,
      bloodPressure,
      cholesterol,
      bloodSugar,
      bmi,
      smokingStatus,
      exerciseFrequency,
      familyHistory,
    } = req.body;

    // Parse blood pressure
    const [systolic, diastolic] = bloodPressure.split('/').map(Number);

    // ======= AI Risk Calculation Algorithm =======
    let heartRisk = 0;
    let diabetesRisk = 0;
    let strokeRisk = 0;
    let bpRisk = 0;

    // Age factor
    if (age > 60) {
      heartRisk += 20;
      strokeRisk += 15;
      diabetesRisk += 10;
    } else if (age > 45) {
      heartRisk += 12;
      strokeRisk += 8;
      diabetesRisk += 8;
    } else if (age > 30) {
      heartRisk += 5;
      strokeRisk += 3;
      diabetesRisk += 5;
    }

    // Blood pressure
    if (systolic > 140 || diastolic > 90) {
      heartRisk += 25;
      bpRisk += 40;
      strokeRisk += 20;
    } else if (systolic > 130 || diastolic > 85) {
      heartRisk += 15;
      bpRisk += 25;
      strokeRisk += 10;
    } else if (systolic > 120) {
      heartRisk += 5;
      bpRisk += 10;
    }

    // Cholesterol
    if (cholesterol > 240) {
      heartRisk += 25;
      strokeRisk += 15;
    } else if (cholesterol > 200) {
      heartRisk += 15;
      strokeRisk += 8;
    } else if (cholesterol > 170) {
      heartRisk += 5;
    }

    // Blood sugar
    if (bloodSugar > 126) {
      diabetesRisk += 40;
      heartRisk += 10;
    } else if (bloodSugar > 100) {
      diabetesRisk += 20;
      heartRisk += 5;
    }

    // Gender factor
    if (gender === 'Male') {
      heartRisk += 5;
    }

    // Cap at 100
    heartRisk = Math.min(heartRisk, 95);
    diabetesRisk = Math.min(diabetesRisk, 95);
    strokeRisk = Math.min(strokeRisk, 95);
    bpRisk = Math.min(bpRisk, 95);

    // Determine overall risk
    const maxRisk = Math.max(heartRisk, diabetesRisk, strokeRisk, bpRisk);
    let overallRisk = 'low';
    if (maxRisk > 60) overallRisk = 'critical';
    else if (maxRisk > 40) overallRisk = 'high';
    else if (maxRisk > 20) overallRisk = 'moderate';

    // Generate recommendations
    const recommendations = [];
    if (heartRisk > 20) recommendations.push('Schedule a cardiology consultation');
    if (diabetesRisk > 20) recommendations.push('Monitor blood sugar levels regularly');
    if (bpRisk > 20) recommendations.push('Reduce sodium intake and monitor BP daily');
    if (cholesterol > 200) recommendations.push('Follow a low-cholesterol diet plan');
    recommendations.push('Maintain 30 minutes of daily exercise');
    recommendations.push('Stay hydrated - drink at least 3L water daily');
    recommendations.push('Get 7-8 hours of quality sleep');

    // Get summary text
    let summary = '';
    if (overallRisk === 'low') {
      summary = 'Your vitals are within the healthy range. Keep up the good work!';
    } else if (overallRisk === 'moderate') {
      summary = 'Some of your vitals need attention. Follow the recommendations below.';
    } else if (overallRisk === 'high') {
      summary = 'Several risk factors detected. Please consult a healthcare provider soon.';
    } else {
      summary = 'Critical risk factors detected. Please seek medical attention immediately.';
    }

    // Recommended doctors based on risks
    const recommendedDoctors = [];
    if (heartRisk > 15) {
      recommendedDoctors.push({
        name: 'Dr. Emily White',
        specialty: 'Cardiologist',
        distance: '2.5 km',
        rating: 4.9,
        image:
          'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80',
      });
    }
    recommendedDoctors.push({
      name: 'Dr. Raj Patel',
      specialty: 'General Physician',
      distance: '4.1 km',
      rating: 4.7,
      image:
        'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80',
    });
    if (diabetesRisk > 15) {
      recommendedDoctors.push({
        name: 'Dr. Aisha Khan',
        specialty: 'Endocrinologist',
        distance: '3.2 km',
        rating: 4.8,
        image:
          'https://images.unsplash.com/photo-1594824476967-48c8b964972f?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80',
      });
    }

    // Diet plan (Indian-focused as per frontend)
    const dietPlan = {
      breakfast: overallRisk === 'low' ? 'Oats Upma + Green Tea' : 'Moong Dal Chilla + Herbal Tea',
      lunch: overallRisk === 'low' ? '2 Roti + Dal + Sabzi' : 'Brown Rice + Grilled Fish + Salad',
      dinner: overallRisk === 'low' ? 'Grilled Paneer Salad' : 'Vegetable Soup + Multigrain Roti',
      snacks: 'Mixed Nuts + Seasonal Fruits',
      notes:
        cholesterol > 200
          ? 'Avoid fried and processed foods'
          : 'Balanced diet with adequate proteins',
    };

    // Workout plan
    const workoutPlan = [
      { day: 'Mon', exercise: heartRisk > 30 ? 'Light Walking' : 'Cardio', duration: '30 mins' },
      { day: 'Tue', exercise: 'Yoga', duration: '45 mins' },
      {
        day: 'Wed',
        exercise: heartRisk > 30 ? 'Light Walking' : 'Strength Training',
        duration: '30 mins',
      },
      { day: 'Thu', exercise: 'Swimming', duration: '30 mins' },
      { day: 'Fri', exercise: 'Cardio', duration: '30 mins' },
    ];

    // Save prediction
    const prediction = await RiskPrediction.create({
      user: req.user._id,
      input: {
        age,
        gender,
        bloodPressure,
        cholesterol,
        bloodSugar,
        bmi,
        smokingStatus,
        exerciseFrequency,
        familyHistory,
      },
      results: {
        overallRisk,
        heartDiseaseRisk: heartRisk,
        diabetesRisk,
        strokeRisk,
        bpRisk,
        summary,
        recommendations,
      },
      recommendedDoctors,
      dietPlan,
      workoutPlan,
    });

    // Send notification
    await Notification.create({
      user: req.user._id,
      title: 'Risk Analysis Complete',
      message: `Your overall health risk is: ${overallRisk.toUpperCase()}`,
      type: 'health',
      link: '/dashboard/risk-prediction',
    });

    res.status(201).json({
      success: true,
      prediction: {
        overallRisk,
        heartDiseaseRisk: heartRisk,
        diabetesRisk,
        strokeRisk,
        bpRisk,
        summary,
        recommendations,
        recommendedDoctors,
        dietPlan,
        workoutPlan,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get risk prediction history
// @route   GET /api/risk-prediction/history
// @access  Private
export const getRiskHistory = async (req, res) => {
  try {
    const isAll = String(req.query.all || '').toLowerCase() === 'true';
    const requestedLimit = Number(req.query.limit);
    const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 500) : 10;

    const query = RiskPrediction.find({ user: req.user._id }).sort({ createdAt: -1 });
    if (!isAll) {
      query.limit(limit);
    }

    const predictions = await query;
    res.json({ success: true, predictions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get latest risk prediction
// @route   GET /api/risk-prediction/latest
// @access  Private
export const getLatestRisk = async (req, res) => {
  try {
    const prediction = await RiskPrediction.findOne({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, prediction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
