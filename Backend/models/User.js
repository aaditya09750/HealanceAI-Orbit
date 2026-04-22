import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default
    },
    avatar: {
      type: String,
      default:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    plan: {
      type: String,
      enum: ['free', 'premium', 'enterprise'],
      default: 'free',
    },
    provider: {
      type: String,
      enum: ['local', 'google', 'github'],
      default: 'local',
    },
    providerId: String,
    whatsappNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    whatsappOtpHash: String,
    whatsappOtpExpire: Date,
    // Health profile
    profile: {
      age: Number,
      gender: { type: String, enum: ['male', 'female', 'other'] },
      height: Number, // in cm
      weight: Number, // in kg
      bloodGroup: String,
      medicalConditions: [String],
      medications: [String],
    },
    // Notification settings
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      medicationReminders: { type: Boolean, default: true },
    },
    // Walk & Earn
    coins: { type: Number, default: 0 },
    totalStepsAllTime: { type: Number, default: 0 },
    // Bookmarks
    bookmarkedBlogs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Blog' }],

    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  }
);

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
