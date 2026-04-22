import OpenAI from 'openai';
import { WalkEarn } from '../models/WalkEarn.js';
import Goal from '../models/Goal.js';
import HealthData from '../models/HealthData.js';
import SymptomPrediction from '../models/SymptomPrediction.js';
import RiskPrediction from '../models/RiskPrediction.js';

// Lazy OpenAI client (mirrors chatbotController pattern)
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'sk-your-openai-api-key-here') return null;
  return new OpenAI({ apiKey });
};

// 15-minute in-memory cache keyed by userId for insights
const insightsCache = new Map();
const INSIGHTS_TTL_MS = 15 * 60 * 1000;

const startOfDay = (d = new Date()) => {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const clampPct = (v) => Math.max(0, Math.min(100, Math.round(v || 0)));

// Compute a composite health score for a given day from:
// 30% steps%, 25% water%, 25% goals%, 20% prediction recency
const computeHealthScore = ({ stepsPct, waterPct, goalsPct, predictionFreshnessPct }) => {
  const score =
    0.3 * (stepsPct || 0) +
    0.25 * (waterPct || 0) +
    0.25 * (goalsPct || 0) +
    0.2 * (predictionFreshnessPct || 0);
  return clampPct(score);
};

// @desc   Dashboard summary — health score, streak, today totals
// @route  GET /api/dashboard/summary
// @access Private
export const getSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = startOfDay();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's steps from WalkEarn
    const walkToday = await WalkEarn.findOne({
      user: userId,
      date: { $gte: today, $lt: tomorrow },
    });
    const todaySteps = walkToday?.steps || 0;
    const stepsGoal = walkToday?.dailyGoal || 10000;
    const stepsPct = clampPct((todaySteps / stepsGoal) * 100);

    // Today's water intake from HealthData
    const healthToday = await HealthData.findOne({
      user: userId,
      date: { $gte: today, $lt: tomorrow },
    });
    const waterIntake = healthToday?.waterIntake || 0;
    const waterPct = clampPct((waterIntake / 3) * 100);

    // Active goals + completion average
    const activeGoals = await Goal.find({ user: userId, isCompleted: false });
    const goalsPct = activeGoals.length
      ? clampPct(
          activeGoals.reduce((sum, g) => {
            const pct = g.target > 0 ? (g.current / g.target) * 100 : 0;
            return sum + Math.min(pct, 100);
          }, 0) / activeGoals.length
        )
      : 0;

    // Prediction freshness (100 if any prediction in last 7d, decays to 0 over 30d)
    const latestSymptom = await SymptomPrediction.findOne({ user: userId }).sort({ createdAt: -1 });
    const latestRisk = await RiskPrediction.findOne({ user: userId }).sort({ createdAt: -1 });
    const latestPredictionAt = [latestSymptom?.createdAt, latestRisk?.createdAt]
      .filter(Boolean)
      .sort((a, b) => new Date(b) - new Date(a))[0];

    let predictionFreshnessPct = 0;
    if (latestPredictionAt) {
      const daysSince =
        (Date.now() - new Date(latestPredictionAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince <= 7) predictionFreshnessPct = 100;
      else if (daysSince >= 30) predictionFreshnessPct = 0;
      else predictionFreshnessPct = Math.round(((30 - daysSince) / 23) * 100);
    }

    const healthScore = computeHealthScore({
      stepsPct,
      waterPct,
      goalsPct,
      predictionFreshnessPct,
    });

    // Streak — count back from today, day is counted if steps% OR water% OR goals% >= 50
    let streakDays = 0;
    const maxStreakLookback = 60;
    for (let i = 0; i < maxStreakLookback; i++) {
      const dayStart = new Date(today);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const [dayWalk, dayHealth] = await Promise.all([
        WalkEarn.findOne({ user: userId, date: { $gte: dayStart, $lt: dayEnd } }),
        HealthData.findOne({ user: userId, date: { $gte: dayStart, $lt: dayEnd } }),
      ]);

      const dayStepsPct = dayWalk?.dailyGoal
        ? clampPct((dayWalk.steps / dayWalk.dailyGoal) * 100)
        : 0;
      const dayWaterPct = dayHealth?.waterIntake ? clampPct((dayHealth.waterIntake / 3) * 100) : 0;

      if (dayStepsPct >= 50 || dayWaterPct >= 50) {
        streakDays += 1;
      } else {
        break;
      }
    }

    // Top goal (highest completion %)
    const topGoal =
      activeGoals
        .map((g) => ({
          title: g.title,
          pct: g.target > 0 ? Math.min(Math.round((g.current / g.target) * 100), 100) : 0,
        }))
        .sort((a, b) => b.pct - a.pct)[0] || null;

    // 7-day average healthScore (simple — reuse trend logic inline)
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 6);
    const [weekWalks, weekHealth] = await Promise.all([
      WalkEarn.find({ user: userId, date: { $gte: weekAgo } }),
      HealthData.find({ user: userId, date: { $gte: weekAgo } }),
    ]);
    let avgScore7d = healthScore;
    if (weekWalks.length || weekHealth.length) {
      const byDay = {};
      for (const w of weekWalks) {
        const key = startOfDay(w.date).toISOString();
        byDay[key] = byDay[key] || {};
        byDay[key].stepsPct = clampPct((w.steps / (w.dailyGoal || 10000)) * 100);
      }
      for (const h of weekHealth) {
        const key = startOfDay(h.date).toISOString();
        byDay[key] = byDay[key] || {};
        byDay[key].waterPct = clampPct((h.waterIntake / 3) * 100);
      }
      const scores = Object.values(byDay).map((d) =>
        computeHealthScore({
          stepsPct: d.stepsPct || 0,
          waterPct: d.waterPct || 0,
          goalsPct,
          predictionFreshnessPct,
        })
      );
      avgScore7d = scores.length
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : healthScore;
    }

    return res.json({
      success: true,
      data: {
        healthScore,
        streakDays,
        avgScore7d,
        topGoal,
        todayTotals: {
          steps: todaySteps,
          stepsGoal,
          stepsPct,
          waterIntake,
          waterPct,
          goalsActive: activeGoals.length,
          goalsPct,
        },
        nextAction: pickNextAction({
          stepsPct,
          waterPct,
          hasRecentPrediction: !!latestPredictionAt && predictionFreshnessPct >= 70,
        }),
      },
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const pickNextAction = ({ stepsPct, waterPct, hasRecentPrediction }) => {
  if (stepsPct < 50) {
    return { key: 'walk', label: 'Take a walk', href: '/dashboard/reverse-planner' };
  }
  if (waterPct < 75) {
    return { key: 'water', label: 'Drink water', href: null };
  }
  if (!hasRecentPrediction) {
    return { key: 'symptoms', label: 'Check symptoms', href: '/dashboard/risk-prediction' };
  }
  return { key: 'ontrack', label: "You're on track", href: null };
};

// @desc   Dashboard trends — per-day metrics for chart
// @route  GET /api/dashboard/trends?range=7d|30d
// @access Private
export const getTrends = async (req, res) => {
  try {
    const userId = req.user._id;
    const range = req.query.range === '30d' ? 30 : 7;
    const today = startOfDay();

    const rangeStart = new Date(today);
    rangeStart.setDate(rangeStart.getDate() - (range - 1));

    const [walks, healthDocs, goals] = await Promise.all([
      WalkEarn.find({ user: userId, date: { $gte: rangeStart } }),
      HealthData.find({ user: userId, date: { $gte: rangeStart } }),
      Goal.find({ user: userId }),
    ]);

    // Current active-goal completion % (same across days — goal state isn't
    // historically tracked here; this is a reasonable approximation)
    const activeGoals = goals.filter((g) => !g.isCompleted);
    const goalsPct = activeGoals.length
      ? clampPct(
          activeGoals.reduce((sum, g) => {
            const pct = g.target > 0 ? (g.current / g.target) * 100 : 0;
            return sum + Math.min(pct, 100);
          }, 0) / activeGoals.length
        )
      : 0;

    // Build per-day map
    const days = [];
    for (let i = 0; i < range; i++) {
      const d = new Date(rangeStart);
      d.setDate(d.getDate() + i);
      const dEnd = new Date(d);
      dEnd.setDate(dEnd.getDate() + 1);

      const walk = walks.find((w) => {
        const wDate = startOfDay(w.date);
        return wDate.getTime() === d.getTime();
      });
      const health = healthDocs.find((h) => {
        const hDate = startOfDay(h.date);
        return hDate.getTime() === d.getTime();
      });

      const stepsPct = walk?.dailyGoal ? clampPct((walk.steps / walk.dailyGoal) * 100) : 0;
      const waterPct = health?.waterIntake ? clampPct((health.waterIntake / 3) * 100) : 0;
      const healthScore = computeHealthScore({
        stepsPct,
        waterPct,
        goalsPct,
        predictionFreshnessPct: 0,
      });

      days.push({
        date: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        stepsPct,
        waterPct,
        goalsPct,
        healthScore,
      });
    }

    return res.json({ success: true, days });
  } catch (error) {
    console.error('Dashboard trends error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Rule-based insight generator — used as fallback when LLM unavailable
const buildRuleBasedInsights = (ctx) => {
  const insights = [];
  const { steps, stepsGoal, waterIntake, goalsPct, latestSymptom, latestRisk } = ctx;
  const stepsPct = stepsGoal ? (steps / stepsGoal) * 100 : 0;

  if (stepsPct < 50) {
    insights.push({
      icon: 'activity',
      severity: 'warn',
      title: 'Pick up your pace',
      body: `You're at ${Math.round(stepsPct)}% of today's step goal. A brisk 20-minute walk can lift that into the green zone.`,
    });
  } else if (stepsPct >= 100) {
    insights.push({
      icon: 'activity',
      severity: 'info',
      title: 'Step goal crushed',
      body: `You've already hit your daily goal (${steps.toLocaleString()} steps). Great pace — keep the streak going.`,
    });
  }

  if (waterIntake < 1.5) {
    insights.push({
      icon: 'moon',
      severity: 'warn',
      title: 'Hydration is low',
      body: `You've had ${waterIntake.toFixed(1)}L so far. Aim for 3L across the day — a glass each hour keeps you on track.`,
    });
  }

  if (
    latestRisk &&
    (latestRisk.results?.overallRisk === 'high' || latestRisk.results?.overallRisk === 'critical')
  ) {
    insights.push({
      icon: 'heart',
      severity: 'critical',
      title: 'Recent risk flagged',
      body:
        latestRisk.results?.summary?.slice(0, 140) ||
        'Your latest risk check came back elevated. Review the recommendations and consider a follow-up.',
    });
  }

  if (!latestSymptom) {
    insights.push({
      icon: 'brain',
      severity: 'info',
      title: 'Run your first symptom check',
      body: 'Logging symptoms helps the model learn your baseline. It only takes 30 seconds.',
    });
  }

  if (goalsPct >= 80) {
    insights.push({
      icon: 'activity',
      severity: 'info',
      title: 'Goals nearly done',
      body: `Average ${goalsPct}% across active goals — one more push and today is a clean sweep.`,
    });
  }

  return insights.slice(0, 3);
};

// @desc   Dashboard insights — LLM-generated from current metrics (cached 15m)
// @route  GET /api/dashboard/insights
// @access Private
export const getInsights = async (req, res) => {
  try {
    const userId = String(req.user._id);

    // Cache check
    const cached = insightsCache.get(userId);
    if (cached && Date.now() - cached.at < INSIGHTS_TTL_MS) {
      return res.json({
        success: true,
        insights: cached.insights,
        source: cached.source,
        cached: true,
      });
    }

    const today = startOfDay();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [walkToday, healthToday, activeGoals, latestSymptom, latestRisk] = await Promise.all([
      WalkEarn.findOne({ user: userId, date: { $gte: today, $lt: tomorrow } }),
      HealthData.findOne({ user: userId, date: { $gte: today, $lt: tomorrow } }),
      Goal.find({ user: userId, isCompleted: false }),
      SymptomPrediction.findOne({ user: userId }).sort({ createdAt: -1 }),
      RiskPrediction.findOne({ user: userId }).sort({ createdAt: -1 }),
    ]);

    const ctx = {
      steps: walkToday?.steps || 0,
      stepsGoal: walkToday?.dailyGoal || 10000,
      waterIntake: healthToday?.waterIntake || 0,
      goalsCount: activeGoals.length,
      goalsPct: activeGoals.length
        ? clampPct(
            activeGoals.reduce((sum, g) => {
              const pct = g.target > 0 ? (g.current / g.target) * 100 : 0;
              return sum + Math.min(pct, 100);
            }, 0) / activeGoals.length
          )
        : 0,
      latestSymptom: latestSymptom
        ? {
            disease: latestSymptom.predictedDisease,
            confidence: latestSymptom.confidence,
            symptoms: latestSymptom.selectedSymptoms?.slice(0, 5) || [],
            daysAgo: Math.round(
              (Date.now() - new Date(latestSymptom.createdAt).getTime()) / (1000 * 60 * 60 * 24)
            ),
          }
        : null,
      latestRisk: latestRisk
        ? {
            overallRisk: latestRisk.results?.overallRisk,
            heartRisk: latestRisk.results?.heartDiseaseRisk,
            diabetesRisk: latestRisk.results?.diabetesRisk,
            summary: latestRisk.results?.summary,
            daysAgo: Math.round(
              (Date.now() - new Date(latestRisk.createdAt).getTime()) / (1000 * 60 * 60 * 24)
            ),
          }
        : null,
    };

    const openai = getOpenAIClient();
    let insights = null;
    let source = 'rules';

    if (openai) {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          response_format: { type: 'json_object' },
          temperature: 0.4,
          max_tokens: 400,
          messages: [
            {
              role: 'system',
              content:
                'You are a concise health-dashboard insights engine. Given today\'s user metrics, return 2-3 actionable insights as JSON. Respond ONLY as JSON of the form {"insights":[{"icon":"activity|heart|brain|moon","severity":"info|warn|critical","title":"<short title, max 6 words>","body":"<one sentence, max 24 words>"}]}. Focus on the single most useful next step per insight. Avoid repeating generic advice. Never claim to diagnose.',
            },
            {
              role: 'user',
              content: JSON.stringify(ctx),
            },
          ],
        });

        const raw = completion.choices?.[0]?.message?.content;
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed.insights) && parsed.insights.length) {
            insights = parsed.insights
              .slice(0, 3)
              .map((i) => ({
                icon: ['activity', 'heart', 'brain', 'moon'].includes(i.icon) ? i.icon : 'activity',
                severity: ['info', 'warn', 'critical'].includes(i.severity) ? i.severity : 'info',
                title: String(i.title || '').slice(0, 80),
                body: String(i.body || '').slice(0, 200),
              }))
              .filter((i) => i.title && i.body);
            source = 'llm';
          }
        }
      } catch (llmErr) {
        console.error('Dashboard insights LLM error:', llmErr.message);
      }
    }

    if (!insights || insights.length === 0) {
      insights = buildRuleBasedInsights(ctx);
      source = 'rules';
    }

    insightsCache.set(userId, { at: Date.now(), insights, source });

    return res.json({ success: true, insights, source, cached: false });
  } catch (error) {
    console.error('Dashboard insights error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
