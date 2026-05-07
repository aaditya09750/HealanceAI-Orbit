import React, { useEffect, useRef, useState } from 'react';
import { User, Save, UploadCloud, Loader2 } from 'lucide-react';
import Button from '../../shared/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import DashReveal from '../../shared/ui/DashReveal';
import Avatar from '../../shared/ui/Avatar';
import { API_URL } from '../../constants/config';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const avatarInputRef = useRef(null);
  const { toast } = useToast();
  const backendBase = API_URL.replace(/\/api\/?$/, '');
  const avatarSrc = user?.avatar
    ? user.avatar.startsWith('http')
      ? user.avatar
      : `${backendBase}${user.avatar}`
    : null;

  const [profileForm, setProfileForm] = useState({
    name: '',
    age: '',
    gender: '',
    height: '',
    weight: '',
    bloodGroup: '',
    medicalConditions: '',
    medications: '',
  });

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!user) return;

    setProfileForm({
      name: user.name || '',
      age: user.profile?.age ?? '',
      gender: user.profile?.gender || '',
      height: user.profile?.height ?? '',
      weight: user.profile?.weight ?? '',
      bloodGroup: user.profile?.bloodGroup || '',
      medicalConditions: (user.profile?.medicalConditions || []).join(', '),
      medications: (user.profile?.medications || []).join(', '),
    });
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const toStringArray = (value) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      toast({ title: 'Name is required', variant: 'error' });
      return;
    }

    setIsSavingProfile(true);

    try {
      const payload = {
        name: profileForm.name.trim(),
        profile: {
          age: profileForm.age === '' ? undefined : Number(profileForm.age),
          gender: profileForm.gender || undefined,
          height: profileForm.height === '' ? undefined : Number(profileForm.height),
          weight: profileForm.weight === '' ? undefined : Number(profileForm.weight),
          bloodGroup: profileForm.bloodGroup.trim() || undefined,
          medicalConditions: toStringArray(profileForm.medicalConditions),
          medications: toStringArray(profileForm.medications),
        },
      };

      const data = await authService.updateProfile(payload);
      if (data?.user) {
        updateUser(data.user);
      }

      toast({ title: 'Profile updated', variant: 'success' });
    } catch (error) {
      toast({
        title: error.response?.data?.message || 'Failed to update profile',
        variant: 'error',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Please select a valid image file.', variant: 'error' });
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const data = await authService.uploadProfileAvatar(file);
      if (data?.user) {
        updateUser(data.user);
      }
      toast({ title: 'Profile photo uploaded', variant: 'success' });
    } catch (error) {
      toast({ title: error.response?.data?.message || 'Failed to upload photo', variant: 'error' });
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <DashReveal className="grid grid-cols-1 gap-6">
        <div className="dash-card-static dash-card-accent" style={{ '--accent-stripe': '#506cd7' }}>
          <h3 className="dash-heading text-base sm:text-lg mb-5 flex items-center gap-2">
            <div className="dash-icon-badge dash-icon-badge--gradient-indigo">
              <User size={20} className="text-white" />
            </div>
            <span>Personal Information</span>
          </h3>

          <div
            className="mb-5 p-5 rounded-[20px] relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #f5f7ff 0%, #ffffff 55%, #fdf2f5 100%)',
              border: '1px solid rgba(226, 232, 240, 0.9)',
              boxShadow: '0 8px 28px rgba(80, 108, 215, 0.10)',
            }}
          >
            <div
              className="absolute -top-20 -right-20 w-52 h-52 rounded-full pointer-events-none"
              style={{
                background:
                  'radial-gradient(closest-side, rgba(80, 108, 215, 0.10), transparent 70%)',
              }}
            />
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4">
              <div
                className="p-1.5 rounded-full"
                style={{ background: 'linear-gradient(135deg, #506cd7, #0ea5e9)' }}
              >
                <div className="p-1 bg-white rounded-full">
                  <Avatar src={avatarSrc} name={user?.name} size={80} className="" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wider font-semibold text-[#506cd7] mb-0.5">
                  Profile Photo
                </p>
                <p className="text-sm text-[#5f697a] mb-2">PNG or JPG, max 5MB</p>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                >
                  {isUploadingAvatar ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" /> Uploading...
                    </>
                  ) : (
                    <>
                      Upload Photo <UploadCloud size={16} className="ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4 sm:space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#0b1030] mb-1.5">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={profileForm.name}
                  onChange={handleProfileChange}
                  className="dash-input"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0b1030] mb-1.5">Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="dash-input !bg-[#e8eaf9] text-[#5f697a] cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#0b1030] mb-1.5">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={user?.whatsappNumber || 'Not available'}
                  disabled
                  className="dash-input !bg-[#e8eaf9] text-[#5f697a] cursor-not-allowed"
                />
                <p className="text-xs text-[#5f697a] mt-1">
                  This number is linked to your login and cannot be edited.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#0b1030] mb-1.5">Age</label>
                <input
                  type="number"
                  min="1"
                  name="age"
                  value={profileForm.age}
                  onChange={handleProfileChange}
                  className="dash-input"
                  placeholder="28"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0b1030] mb-1.5">Gender</label>
                <select
                  name="gender"
                  value={profileForm.gender}
                  onChange={handleProfileChange}
                  className="dash-input"
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0b1030] mb-1.5">
                  Height (cm)
                </label>
                <input
                  type="number"
                  min="1"
                  name="height"
                  value={profileForm.height}
                  onChange={handleProfileChange}
                  className="dash-input"
                  placeholder="170"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0b1030] mb-1.5">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  min="1"
                  name="weight"
                  value={profileForm.weight}
                  onChange={handleProfileChange}
                  className="dash-input"
                  placeholder="65"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0b1030] mb-1.5">Blood Group</label>
              <input
                type="text"
                name="bloodGroup"
                value={profileForm.bloodGroup}
                onChange={handleProfileChange}
                className="dash-input"
                placeholder="B+"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#0b1030] mb-1.5">
                  Medical Conditions
                </label>
                <textarea
                  rows="3"
                  name="medicalConditions"
                  value={profileForm.medicalConditions}
                  onChange={handleProfileChange}
                  className="dash-input resize-none"
                  placeholder="Diabetes, Hypertension"
                />
                <p className="text-xs text-[#5f697a] mt-1">
                  Use comma to separate multiple values.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0b1030] mb-1.5">
                  Medications
                </label>
                <textarea
                  rows="3"
                  name="medications"
                  value={profileForm.medications}
                  onChange={handleProfileChange}
                  className="dash-input resize-none"
                  placeholder="Metformin, Aspirin"
                />
                <p className="text-xs text-[#5f697a] mt-1">
                  Use comma to separate multiple values.
                </p>
              </div>
            </div>

            <div className="pt-1">
              <Button type="submit" disabled={isSavingProfile}>
                {isSavingProfile ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    Save Profile <Save size={16} className="ml-2" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DashReveal>
    </div>
  );
};

export default Profile;
