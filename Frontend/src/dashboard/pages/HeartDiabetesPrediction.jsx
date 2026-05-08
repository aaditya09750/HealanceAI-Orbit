import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Droplets, Loader2, Send, Activity, Scale, Lightbulb } from 'lucide-react';
import { riskService } from '../../services/api';
import Button from '../../shared/ui/Button';
import DashReveal from '../../shared/ui/DashReveal';
import { useAuth } from '../../context/AuthContext';

const initialForm = {
  age: '',
  gender: 'Male',
  weight: '',
  height: '',
  glucose: '',
  bloodPressure: '',
  cholesterol: '',
};

const parseNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getBmiCategory = (bmi) => {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
};

const RiskResultCard = ({ label, icon: Icon, isRisk, riskText, safeText }) => {
  const gradient = isRisk
    ? 'linear-gradient(135deg, #fef2f2 0%, #ffffff 55%, #fee2e2 100%)'
    : 'linear-gradient(135deg, #ecfdf5 0%, #ffffff 55%, #d1fae5 100%)';
  const badgeClass = isRisk
    ? 'dash-icon-badge--gradient-rose'
    : 'dash-icon-badge--gradient-emerald';
  const statusColor = isRisk ? '#dc2626' : '#059669';
  return (
    <div
      className="rounded-[20px] border border-white/80 p-5 relative overflow-hidden"
      style={{ background: gradient, boxShadow: '0 10px 28px rgba(2, 6, 23, 0.06)' }}
    >
      <div className="flex items-center gap-3 relative z-10">
        <div className={`dash-icon-badge ${badgeClass}`}>
          <Icon size={20} className="text-white" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider font-semibold text-[#6a7283]">{label}</p>
          <p className="text-lg font-heading font-bold mt-0.5" style={{ color: statusColor }}>
            {isRisk ? riskText : safeText}
          </p>
        </div>
      </div>
    </div>
  );
};

const HeartDiabetesPrediction = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [results, setResults] = useState(null);
  const [message, setMessage] = useState('');

  // Auto-fill baseline fields from user's saved medical profile
  useEffect(() => {
    if (!user?.profile) return;
    const p = user.profile;
    setFormData((prev) => ({
      ...prev,
      age: p.age != null ? String(p.age) : prev.age,
      gender: p.gender === 'female' ? 'Female' : p.gender === 'male' ? 'Male' : prev.gender,
      height: p.height != null ? String(p.height) : prev.height,
      weight: p.weight != null ? String(p.weight) : prev.weight,
    }));
  }, [user]);

  // Wake the ML dyno on free tier as soon as the user lands on the page.
  // By the time they finish filling the form, the service is already warm.
  useEffect(() => {
    riskService.warmupMl?.();
  }, []);

  // Show contextual loading messages so 30-60s cold starts feel like progress.
  const [loadingPhase, setLoadingPhase] = useState('');
  useEffect(() => {
    if (!isLoading) {
      setLoadingPhase('');
      return undefined;
    }
    setLoadingPhase('Analyzing your health data...');
    const t1 = setTimeout(
      () => setLoadingPhase('AI service is warming up. Please wait...'),
      6000
    );
    const t2 = setTimeout(() => setLoadingPhase('Almost there, finalizing prediction...'), 18000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isLoading]);

  const bmi = useMemo(() => {
    const weight = parseNumber(formData.weight);
    const height = parseNumber(formData.height);
    if (!weight || !height) return null;
    const meters = height / 100;
    return Number((weight / (meters * meters)).toFixed(2));
  }, [formData.weight, formData.height]);

  const bmiCategory = useMemo(() => {
    if (!bmi) return '-';
    return getBmiCategory(bmi);
  }, [bmi]);

  const validate = () => {
    const nextErrors = {};

    const age = parseNumber(formData.age);
    const weight = parseNumber(formData.weight);
    const height = parseNumber(formData.height);
    const glucose = parseNumber(formData.glucose);
    const bloodPressure = parseNumber(formData.bloodPressure);
    const cholesterol = parseNumber(formData.cholesterol);

    if (!age || age < 1 || age > 120) nextErrors.age = 'Required';
    if (!weight || weight < 20 || weight > 350) nextErrors.weight = 'Required';
    if (!height || height < 90 || height > 250) nextErrors.height = 'Required';
    if (!glucose || glucose < 40 || glucose > 500) nextErrors.glucose = 'Required';
    if (!bloodPressure || bloodPressure < 40 || bloodPressure > 280) {
      nextErrors.bloodPressure = 'Required';
    }
    if (!cholesterol || cholesterol < 80 || cholesterol > 700) {
      nextErrors.cholesterol = 'Required';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePredict = async (event) => {
    event.preventDefault();
    setMessage('');

    if (!validate()) return;

    try {
      setIsLoading(true);
      const payload = {
        age: Number(formData.age),
        gender: formData.gender,
        weight: Number(formData.weight),
        height: Number(formData.height),
        glucose: Number(formData.glucose),
        bloodPressure: Number(formData.bloodPressure),
        cholesterol: Number(formData.cholesterol),
      };

      const response = await riskService.predictAll(payload);
      if (response.success) {
        setResults(response);
      }
    } catch (error) {
      const raw = error.response?.data?.message || error.message || '';
      const isWarming =
        /warming up|timed out|502|503|504/i.test(raw) ||
        error.response?.status === 502 ||
        error.response?.status === 503 ||
        error.response?.status === 504;
      setMessage(
        isWarming
          ? 'AI service is warming up. Please retry in ~30 seconds.'
          : raw || 'Prediction failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareWhatsapp = async () => {
    if (!results) return;

    try {
      setIsSharing(true);
      setMessage('');

      const response = await riskService.shareToWhatsapp({
        diabetes: results.diabetes,
        heart: results.heart,
        bmi: results.bmi,
        bmiCategory: results.bmiCategory,
      });

      setMessage(response.message || 'Result shared on WhatsApp.');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to share on WhatsApp right now.');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="space-y-6">
      <DashReveal>
        <div className="dash-card-static dash-card-accent" style={{ '--accent-stripe': '#e74c4c' }}>
          <div className="flex items-start gap-3">
            <div className="dash-icon-badge dash-icon-badge--gradient-rose hidden sm:inline-flex">
              <Heart size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-heading font-bold text-[#0b1030]">
                <span className="dash-gradient-text">Heart &amp; Diabetes ML Prediction</span>
              </h2>
              <p className="text-sm text-[#5f697a] mt-1">
                Fill details and get instant risk prediction with BMI and smart suggestions.
              </p>
            </div>
          </div>

          <form
            className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            onSubmit={handlePredict}
          >
            <label className="space-y-1">
              <span className="text-sm font-medium text-[#0b1030]">Age</span>
              <input
                name="age"
                type="number"
                value={formData.age}
                onChange={handleChange}
                className="dash-input"
                placeholder="29"
              />
              {errors.age && <span className="text-xs text-red-600">{errors.age}</span>}
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-[#0b1030]">Gender</span>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="dash-input"
              >
                <option>Male</option>
                <option>Female</option>
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-[#0b1030]">Weight (kg)</span>
              <input
                name="weight"
                type="number"
                value={formData.weight}
                onChange={handleChange}
                className="dash-input"
                placeholder="70"
              />
              {errors.weight && <span className="text-xs text-red-600">{errors.weight}</span>}
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-[#0b1030]">Height (cm)</span>
              <input
                name="height"
                type="number"
                value={formData.height}
                onChange={handleChange}
                className="dash-input"
                placeholder="170"
              />
              {errors.height && <span className="text-xs text-red-600">{errors.height}</span>}
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-[#0b1030]">Glucose level</span>
              <input
                name="glucose"
                type="number"
                value={formData.glucose}
                onChange={handleChange}
                className="dash-input"
                placeholder="115"
              />
              {errors.glucose && <span className="text-xs text-red-600">{errors.glucose}</span>}
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-[#0b1030]">Blood Pressure</span>
              <input
                name="bloodPressure"
                type="number"
                value={formData.bloodPressure}
                onChange={handleChange}
                className="dash-input"
                placeholder="120"
              />
              {errors.bloodPressure && (
                <span className="text-xs text-red-600">{errors.bloodPressure}</span>
              )}
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-[#0b1030]">Cholesterol</span>
              <input
                name="cholesterol"
                type="number"
                value={formData.cholesterol}
                onChange={handleChange}
                className="dash-input"
                placeholder="180"
              />
              {errors.cholesterol && (
                <span className="text-xs text-red-600">{errors.cholesterol}</span>
              )}
            </label>

            <div
              className="rounded-[20px] border border-white/80 px-4 py-3 flex items-center gap-3"
              style={{
                background: 'linear-gradient(135deg, #f5f7ff 0%, #ffffff 55%, #fdf2f5 100%)',
                boxShadow: '0 6px 20px rgba(80, 108, 215, 0.10)',
              }}
            >
              <div
                className="dash-icon-badge dash-icon-badge--gradient-violet"
                style={{ width: 36, height: 36 }}
              >
                <Scale size={16} className="text-white" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-semibold uppercase text-[#506cd7] tracking-wider">
                  Calculated BMI
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-heading font-bold text-[#0b1030]">
                    {bmi || '--'}
                  </span>
                  <span className="text-[11px] text-[#5f697a] truncate">{bmiCategory}</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3">
              <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    {loadingPhase || 'Predicting...'}
                  </span>
                ) : (
                  'Predict Risk'
                )}
              </Button>
            </div>
          </form>
        </div>
      </DashReveal>

      {results && (
        <motion.div
          className="dash-card-static space-y-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RiskResultCard
              label="Diabetes Risk"
              icon={Droplets}
              isRisk={results.diabetes === 'Risk'}
              riskText="Elevated risk"
              safeText="Within normal range"
            />
            <RiskResultCard
              label="Heart Risk"
              icon={Heart}
              isRisk={results.heart === 'Risk'}
              riskText="Elevated risk"
              safeText="Within normal range"
            />
          </div>

          <div className="dash-card dash-card-accent" style={{ '--accent-stripe': '#10b981' }}>
            <h4 className="font-semibold text-[#0b1030] flex items-center gap-2 mb-3">
              <span
                className="dash-icon-badge dash-icon-badge--gradient-emerald"
                style={{ width: 28, height: 28 }}
              >
                <Lightbulb size={12} className="text-white" />
              </span>
              Health Suggestions
            </h4>
            <ul className="text-sm text-[#5f697a] list-disc pl-5 space-y-1">
              {results.suggestions.map((suggestion) => (
                <li key={suggestion}>{suggestion}</li>
              ))}
            </ul>
          </div>

          <div className="flex items-end">
            <Button
              type="button"
              variant="secondary"
              onClick={handleShareWhatsapp}
              disabled={isSharing}
            >
              {isSharing ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Sending...
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <Send size={16} />
                  Send on WhatsApp
                </span>
              )}
            </Button>
          </div>
        </motion.div>
      )}

      {message && <p className="text-sm font-medium text-[#5f697a]">{message}</p>}
    </div>
  );
};

export default HeartDiabetesPrediction;
