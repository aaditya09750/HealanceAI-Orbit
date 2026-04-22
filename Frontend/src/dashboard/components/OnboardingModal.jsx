import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import Button from '../../shared/ui/Button';
import { authService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { cn } from '../../lib/utils';

const toStringArray = (value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const FieldWrapper = ({ id, label, required, optional, hint, error, children }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-[#0b1030] mb-1.5">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
      {optional && <span className="text-xs text-[#6a7283] ml-1">(optional)</span>}
    </label>
    {children}
    {hint && !error && <p className="text-xs text-[#6a7283] mt-1">{hint}</p>}
    {error && (
      <p
        id={`${id}-err`}
        role="alert"
        className="text-xs text-red-500 mt-1 flex items-center gap-1"
      >
        <AlertCircle size={12} /> {error}
      </p>
    )}
  </div>
);

const OnboardingModal = ({ isOpen, onClose, onSkip }) => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({
    age: '',
    gender: '',
    height: '',
    weight: '',
    bloodGroup: '',
    medicalConditions: '',
    medications: '',
  });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const errs = {};
    const age = Number(form.age);
    const height = Number(form.height);
    const weight = Number(form.weight);

    if (!form.age || !Number.isFinite(age) || age < 1 || age > 120)
      errs.age = 'Enter a valid age (1-120)';
    if (!form.gender) errs.gender = 'Please select gender';
    if (!form.height || !Number.isFinite(height) || height < 90 || height > 250)
      errs.height = 'Enter height in cm (90-250)';
    if (!form.weight || !Number.isFinite(weight) || weight < 20 || weight > 350)
      errs.weight = 'Enter weight in kg (20-350)';
    if (!form.bloodGroup.trim()) errs.bloodGroup = 'Blood group is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    try {
      const payload = {
        name: user?.name,
        profile: {
          age: Number(form.age),
          gender: form.gender,
          height: Number(form.height),
          weight: Number(form.weight),
          bloodGroup: form.bloodGroup.trim(),
          medicalConditions: toStringArray(form.medicalConditions),
          medications: toStringArray(form.medications),
        },
      };
      const data = await authService.updateProfile(payload);
      if (data?.user) updateUser(data.user);
      toast({
        title: 'Profile saved',
        description: 'Your details will auto-fill future predictions.',
        variant: 'success',
      });
      onClose();
    } catch (err) {
      toast({
        title: err.response?.data?.message || 'Failed to save profile',
        variant: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-[#0b1030]/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="bg-white rounded-[20px] w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-hide"
        style={{ boxShadow: '0 22px 38px rgba(11, 16, 48, 0.11)' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
      >
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white border-b border-[#e8eaf9] p-5 flex items-start gap-3 z-10">
          <div className="dash-icon-badge bg-[#506cd7] flex-shrink-0">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h3 id="onboarding-title" className="text-lg font-heading font-bold text-[#0b1030]">
              Complete your health profile
            </h3>
            <p className="text-sm text-[#5f697a] mt-0.5">
              This helps us personalize your risk predictions and insights.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Age + Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldWrapper id="onb-age" label="Age" required error={errors.age}>
              <input
                id="onb-age"
                type="number"
                value={form.age}
                onChange={(e) => handleChange('age', e.target.value)}
                aria-describedby={errors.age ? 'onb-age-err' : undefined}
                aria-invalid={!!errors.age}
                className={cn('dash-input', errors.age && 'dash-input-error')}
                placeholder="28"
              />
            </FieldWrapper>
            <FieldWrapper id="onb-gender" label="Gender" required error={errors.gender}>
              <select
                id="onb-gender"
                value={form.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                aria-describedby={errors.gender ? 'onb-gender-err' : undefined}
                aria-invalid={!!errors.gender}
                className={cn('dash-input', errors.gender && 'dash-input-error')}
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </FieldWrapper>
          </div>

          {/* Height + Weight */}
          <div className="grid grid-cols-2 gap-4">
            <FieldWrapper id="onb-height" label="Height (cm)" required error={errors.height}>
              <input
                id="onb-height"
                type="number"
                value={form.height}
                onChange={(e) => handleChange('height', e.target.value)}
                aria-describedby={errors.height ? 'onb-height-err' : undefined}
                aria-invalid={!!errors.height}
                className={cn('dash-input', errors.height && 'dash-input-error')}
                placeholder="170"
              />
            </FieldWrapper>
            <FieldWrapper id="onb-weight" label="Weight (kg)" required error={errors.weight}>
              <input
                id="onb-weight"
                type="number"
                value={form.weight}
                onChange={(e) => handleChange('weight', e.target.value)}
                aria-describedby={errors.weight ? 'onb-weight-err' : undefined}
                aria-invalid={!!errors.weight}
                className={cn('dash-input', errors.weight && 'dash-input-error')}
                placeholder="65"
              />
            </FieldWrapper>
          </div>

          {/* Blood Group */}
          <FieldWrapper id="onb-blood" label="Blood Group" required error={errors.bloodGroup}>
            <input
              id="onb-blood"
              type="text"
              value={form.bloodGroup}
              onChange={(e) => handleChange('bloodGroup', e.target.value)}
              aria-describedby={errors.bloodGroup ? 'onb-blood-err' : undefined}
              aria-invalid={!!errors.bloodGroup}
              className={cn('dash-input', errors.bloodGroup && 'dash-input-error')}
              placeholder="B+"
            />
          </FieldWrapper>

          {/* Medical Conditions */}
          <FieldWrapper
            id="onb-conditions"
            label="Medical Conditions"
            optional
            hint="Separate multiple with commas"
          >
            <textarea
              id="onb-conditions"
              rows="2"
              value={form.medicalConditions}
              onChange={(e) => handleChange('medicalConditions', e.target.value)}
              className="dash-input resize-none"
              placeholder="Diabetes, Hypertension"
            />
          </FieldWrapper>

          {/* Medications */}
          <FieldWrapper
            id="onb-meds"
            label="Current Medications"
            optional
            hint="Separate multiple with commas"
          >
            <textarea
              id="onb-meds"
              rows="2"
              value={form.medications}
              onChange={(e) => handleChange('medications', e.target.value)}
              className="dash-input resize-none"
              placeholder="Metformin, Aspirin"
            />
          </FieldWrapper>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              className="sm:flex-1"
              onClick={onSkip}
              disabled={isSaving}
            >
              Skip for now
            </Button>
            <Button type="submit" className="sm:flex-1" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" /> Saving...
                </>
              ) : (
                'Save & Continue'
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default OnboardingModal;
