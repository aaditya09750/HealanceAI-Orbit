import mongoose from 'mongoose';

const signupOtpSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    whatsappNumber: {
      type: String,
      required: true,
      trim: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    otpExpire: {
      type: Date,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 900,
    },
  },
  {
    timestamps: true,
  }
);

signupOtpSchema.index({ email: 1 });
signupOtpSchema.index({ whatsappNumber: 1 });

const SignupOtp = mongoose.model('SignupOtp', signupOtpSchema);

export default SignupOtp;
