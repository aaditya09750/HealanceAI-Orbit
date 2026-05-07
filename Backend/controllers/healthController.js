import HealthData from '../models/HealthData.js';
import MedicalReport from '../models/MedicalReport.js';

// @desc    Add daily health data
// @route   POST /api/health-data
// @access  Private
export const addHealthData = async (req, res) => {
  try {
    const data = await HealthData.create({
      user: req.user._id,
      ...req.body,
    });
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get today's health data
// @route   GET /api/health-data/today
// @access  Private
export const getTodayData = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let data = await HealthData.findOne({
      user: req.user._id,
      date: { $gte: today, $lt: tomorrow },
    });

    // If no data for today, return defaults
    if (!data) {
      data = {
        vitals: { heartRate: 0, bloodPressure: { systolic: 0, diastolic: 0 } },
        activity: { steps: 0, caloriesBurned: 0, activeMinutes: 0, distance: 0 },
        waterIntake: 0,
        sleep: { duration: 0 },
        healthScore: 0,
      };
    }

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get weekly health trends
// @route   GET /api/health-data/weekly
// @access  Private
export const getWeeklyTrends = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const data = await HealthData.find({
      user: req.user._id,
      date: { $gte: startDate },
    }).sort({ date: 1 });

    // Format data for frontend charts
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyData = data.map((d) => ({
      name: dayNames[new Date(d.date).getDay()],
      score: d.healthScore || 0,
      heart: d.vitals?.heartRate || 0,
      steps: d.activity?.steps || 0,
      water: d.waterIntake || 0,
      sleep: d.sleep?.duration || 0,
      date: d.date,
    }));

    res.json({ success: true, data: weeklyData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get monthly health summary
// @route   GET /api/health-data/monthly
// @access  Private
export const getMonthlySummary = async (req, res) => {
  try {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);

    const data = await HealthData.find({
      user: req.user._id,
      date: { $gte: startDate },
    });

    // Calculate averages
    const total = data.length || 1;
    const summary = {
      avgHealthScore: Math.round(data.reduce((acc, d) => acc + (d.healthScore || 0), 0) / total),
      avgHeartRate: Math.round(
        data.reduce((acc, d) => acc + (d.vitals?.heartRate || 0), 0) / total
      ),
      avgSteps: Math.round(data.reduce((acc, d) => acc + (d.activity?.steps || 0), 0) / total),
      avgWaterIntake: (data.reduce((acc, d) => acc + (d.waterIntake || 0), 0) / total).toFixed(1),
      avgSleep: (data.reduce((acc, d) => acc + (d.sleep?.duration || 0), 0) / total).toFixed(1),
      totalDays: data.length,
    };

    res.json({ success: true, summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update today's health data
// @route   PUT /api/health-data/today
// @access  Private
export const updateTodayData = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const data = await HealthData.findOneAndUpdate(
      { user: req.user._id, date: { $gte: today, $lt: tomorrow } },
      { $set: req.body },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload medical report
// @route   POST /api/health-data/reports
// @access  Private
export const uploadReport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }

    const report = await MedicalReport.create({
      user: req.user._id,
      title: req.body.title || 'Medical Report',
      type: req.body.type || 'general',
      file: {
        filename: req.file.originalname || req.file.filename,
        path: req.file.path, // Cloudinary HTTPS URL
        mimetype: req.file.mimetype,
        size: req.file.size,
      },
      doctorName: req.body.doctorName,
      labName: req.body.labName,
      reportDate: req.body.reportDate,
      notes: req.body.notes,
    });

    res.status(201).json({ success: true, report });
  } catch (error) {
    console.error('[uploadReport] failed:', error);
    if (error?.stack) console.error(error.stack);
    const message =
      error?.message ||
      error?.error?.message ||
      (typeof error === 'string' ? error : 'Upload failed');
    res.status(500).json({ success: false, message, name: error?.name });
  }
};

// @desc    Get all medical reports
// @route   GET /api/health-data/reports
// @access  Private
export const getReports = async (req, res) => {
  try {
    const reports = await MedicalReport.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get dashboard overview stats
// @route   GET /api/health-data/dashboard
// @access  Private
export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's data
    const todayData = await HealthData.findOne({
      user: req.user._id,
      date: { $gte: today, $lt: tomorrow },
    });

    // Get last week's data for comparison
    const lastWeekStart = new Date(today);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const weekData = await HealthData.find({
      user: req.user._id,
      date: { $gte: lastWeekStart, $lt: tomorrow },
    }).sort({ date: 1 });

    // Calculate changes
    const prevWeekAvgSteps =
      weekData.length > 1
        ? weekData.slice(0, -1).reduce((acc, d) => acc + (d.activity?.steps || 0), 0) /
          (weekData.length - 1)
        : 0;

    const user = req.user;

    const stats = {
      daily: {
        steps: todayData?.activity?.steps || 0,
        stepsGoal: 10000,
        waterIntake: todayData?.waterIntake || 0,
        waterGoal: 3,
        caloriesBurned: todayData?.activity?.caloriesBurned || 0,
        sleepDuration: todayData?.sleep?.duration || 0,
        healthScore: todayData?.healthScore || 0,
        heartRate: todayData?.vitals?.heartRate || 0,
      },
      coins: user.coins || 0,
      weeklyTrends: weekData.map((d) => ({
        name: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(d.date).getDay()],
        score: d.healthScore || 0,
        heart: d.vitals?.heartRate || 0,
      })),
      stepsChange:
        prevWeekAvgSteps > 0
          ? `${((((todayData?.activity?.steps || 0) - prevWeekAvgSteps) / prevWeekAvgSteps) * 100).toFixed(0)}%`
          : '+0%',
    };

    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
