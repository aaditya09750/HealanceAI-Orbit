import mongoose from 'mongoose';

const medicalReportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: { type: String, required: true },
    type: {
      type: String,
      enum: ['blood_test', 'xray', 'mri', 'ct_scan', 'ecg', 'general', 'prescription', 'other'],
      default: 'general',
    },
    file: {
      filename: String,
      path: String,
      mimetype: String,
      size: Number,
    },
    // AI-extracted data from the report
    extractedData: {
      summary: String,
      keyFindings: [String],
      abnormalValues: [
        {
          parameter: String,
          value: String,
          normalRange: String,
          status: { type: String, enum: ['normal', 'low', 'high', 'critical'] },
        },
      ],
    },
    doctorName: String,
    labName: String,
    reportDate: Date,
    notes: String,
  },
  {
    timestamps: true,
  }
);

medicalReportSchema.index({ user: 1, createdAt: -1 });

const MedicalReport = mongoose.model('MedicalReport', medicalReportSchema);
export default MedicalReport;
