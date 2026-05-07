import mongoose from 'mongoose';

const SPECIALTIES = [
  'cardiologist',
  'endocrinologist',
  'general physician',
  'dermatologist',
  'orthopedic',
  'neurologist',
  'pediatrician',
  'gynecologist',
  'psychiatrist',
  'urologist',
  'ent',
  'ophthalmologist',
  'gastroenterologist',
  'pulmonologist',
  'oncologist',
  'dentist',
  'neurosurgeon',
  'plastic surgeon',
  'general surgeon',
  'nephrologist',
  'rheumatologist',
  'hematologist',
  'radiologist',
  'anesthesiologist',
  'pathologist',
  'allergist',
  'sports medicine',
  'ayurveda',
  'homeopathy',
  'dietitian',
  'physiotherapist',
  'other',
];

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    photo: { type: String, default: '' }, // URL or /assets/images path
    specialty: {
      type: String,
      required: true,
      lowercase: true,
      enum: SPECIALTIES,
      index: true,
    },
    qualifications: { type: String, default: '' }, // e.g. "MBBS, MD (Cardiology)"
    experienceYears: { type: Number, default: 0, min: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },

    clinicName: { type: String, default: '' }, // e.g. "Fortis Hospital"
    address: {
      line1: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      country: { type: String, default: 'India' },
      pincode: { type: String, default: '' },
    },
    // GeoJSON Point: coordinates = [lon, lat] per MongoDB convention
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [lon, lat]
        required: true,
        validate: {
          validator: (v) =>
            Array.isArray(v) && v.length === 2 && v.every((n) => typeof n === 'number'),
          message: 'Location must be [longitude, latitude]',
        },
      },
    },

    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    website: { type: String, default: '' },

    acceptsNewPatients: { type: Boolean, default: true },
    verified: { type: Boolean, default: true }, // seeded doctors are "verified"; OSM results are not saved here
    source: { type: String, enum: ['seed', 'partner', 'manual', 'generated'], default: 'seed' },
  },
  { timestamps: true }
);

// Geospatial index for $geoNear / $near queries
doctorSchema.index({ location: '2dsphere' });

// Convenience virtuals used by the API response
doctorSchema.virtual('mapUrl').get(function () {
  const [lon, lat] = this.location?.coordinates || [];
  if (typeof lat !== 'number' || typeof lon !== 'number') return '';
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
});

doctorSchema.set('toJSON', { virtuals: true });
doctorSchema.set('toObject', { virtuals: true });

export const DOCTOR_SPECIALTIES = SPECIALTIES;
export default mongoose.model('Doctor', doctorSchema);
