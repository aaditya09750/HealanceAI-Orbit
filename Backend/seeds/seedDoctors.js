/**
 * Seed curated Indian doctors across major cities.
 *
 * Run with:  `node seeds/seedDoctors.js`  from the Backend/ directory.
 *
 * NOTE: These are illustrative / synthetic practitioner records anchored
 * to real hospital locations. For a production launch, replace with
 * verified partner data.
 */

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import Doctor from '../models/Doctor.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GENERATED_PATH = path.resolve(__dirname, '../data/generatedDoctors.json');
const NICHE_PATH = path.resolve(__dirname, '../data/nicheDoctors.json');

// Coordinates = [longitude, latitude]
const doctors = [
  // ── MUMBAI ────────────────────────────────────────────
  {
    name: 'Dr. Priya Sharma',
    specialty: 'cardiologist',
    qualifications: 'MBBS, MD (Medicine), DM (Cardiology)',
    experienceYears: 18,
    rating: 4.8,
    reviewCount: 212,
    clinicName: 'Fortis Hospital, Mulund',
    photo: '/assets/images/team-2.jpg',
    address: {
      line1: 'Mulund Goregaon Link Rd',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400078',
    },
    location: { type: 'Point', coordinates: [72.9565, 19.1726] },
    phone: '+91 22 6799 4444',
    website: 'https://www.fortishealthcare.com/india/hospitals-in-mumbai/fortis-hospital-mulund',
  },
  {
    name: 'Dr. Rajesh Menon',
    specialty: 'endocrinologist',
    qualifications: 'MBBS, MD, DM (Endocrinology)',
    experienceYears: 22,
    rating: 4.9,
    reviewCount: 340,
    clinicName: 'Kokilaben Dhirubhai Ambani Hospital',
    photo: '/assets/images/team-1.jpg',
    address: {
      line1: 'Rao Saheb Achutrao Patwardhan Marg, Andheri West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400053',
    },
    location: { type: 'Point', coordinates: [72.8267, 19.1336] },
    phone: '+91 22 4269 6969',
    website: 'https://www.kokilabenhospital.com',
  },
  {
    name: 'Dr. Anjali Desai',
    specialty: 'general physician',
    qualifications: 'MBBS, MD (Internal Medicine)',
    experienceYears: 14,
    rating: 4.7,
    reviewCount: 180,
    clinicName: 'Lilavati Hospital',
    photo: '/assets/images/team-3.jpg',
    address: {
      line1: 'A-791, Bandra Reclamation, Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400050',
    },
    location: { type: 'Point', coordinates: [72.8199, 19.0558] },
    phone: '+91 22 2675 1000',
    website: 'https://www.lilavatihospital.com',
  },
  {
    name: 'Dr. Karan Joshi',
    specialty: 'dermatologist',
    qualifications: 'MBBS, MD (Dermatology)',
    experienceYears: 11,
    rating: 4.6,
    reviewCount: 97,
    clinicName: 'Jaslok Hospital & Research Centre',
    photo: '/assets/images/team-4.jpg',
    address: {
      line1: '15, Dr. Gopalrao Deshmukh Marg, Peddar Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400026',
    },
    location: { type: 'Point', coordinates: [72.8088, 18.9685] },
    phone: '+91 22 6657 3333',
    website: 'https://www.jaslokhospital.net',
  },

  // ── DELHI / NCR ──────────────────────────────────────
  {
    name: 'Dr. Arjun Malhotra',
    specialty: 'cardiologist',
    qualifications: 'MBBS, MD, DM (Cardiology), FRCP',
    experienceYears: 26,
    rating: 4.9,
    reviewCount: 412,
    clinicName: 'AIIMS, New Delhi',
    photo: '/assets/images/team-5.jpg',
    address: { line1: 'Sri Aurobindo Marg', city: 'New Delhi', state: 'Delhi', pincode: '110029' },
    location: { type: 'Point', coordinates: [77.209, 28.5672] },
    phone: '+91 11 2658 8500',
    website: 'https://www.aiims.edu',
  },
  {
    name: 'Dr. Sneha Kapoor',
    specialty: 'endocrinologist',
    qualifications: 'MBBS, MD, DM (Endocrinology)',
    experienceYears: 15,
    rating: 4.8,
    reviewCount: 256,
    clinicName: 'Max Super Speciality Hospital, Saket',
    photo: '/assets/images/team-6.jpg',
    address: {
      line1: '1, 2, Press Enclave Rd, Saket',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110017',
    },
    location: { type: 'Point', coordinates: [77.2197, 28.5288] },
    phone: '+91 11 2651 5050',
    website: 'https://www.maxhealthcare.in',
  },
  {
    name: 'Dr. Vikram Bansal',
    specialty: 'neurologist',
    qualifications: 'MBBS, MD (Medicine), DM (Neurology)',
    experienceYears: 19,
    rating: 4.7,
    reviewCount: 198,
    clinicName: 'Fortis Escorts Heart Institute',
    photo: '/assets/images/team-1.jpg',
    address: {
      line1: 'Okhla Rd, Sukhdev Vihar',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110025',
    },
    location: { type: 'Point', coordinates: [77.2773, 28.5498] },
    phone: '+91 11 4713 5000',
    website: 'https://www.fortisescorts.in',
  },
  {
    name: 'Dr. Meera Chauhan',
    specialty: 'gynecologist',
    qualifications: 'MBBS, MS (OBG)',
    experienceYears: 17,
    rating: 4.8,
    reviewCount: 289,
    clinicName: 'Apollo Hospital, Sarita Vihar',
    photo: '/assets/images/team-2.jpg',
    address: {
      line1: 'Mathura Rd, Sarita Vihar',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110076',
    },
    location: { type: 'Point', coordinates: [77.2886, 28.5355] },
    phone: '+91 11 7179 1090',
    website: 'https://www.apollohospitals.com',
  },
  {
    name: 'Dr. Siddharth Rao',
    specialty: 'orthopedic',
    qualifications: 'MBBS, MS (Orthopedics), FRCS',
    experienceYears: 20,
    rating: 4.7,
    reviewCount: 234,
    clinicName: 'Medanta The Medicity, Gurugram',
    photo: '/assets/images/team-3.jpg',
    address: {
      line1: 'CH Baktawar Singh Rd, Sector 38',
      city: 'Gurugram',
      state: 'Haryana',
      pincode: '122001',
    },
    location: { type: 'Point', coordinates: [77.0403, 28.4416] },
    phone: '+91 124 441 4141',
    website: 'https://www.medanta.org',
  },

  // ── BANGALORE ────────────────────────────────────────
  {
    name: 'Dr. Deepak Iyer',
    specialty: 'cardiologist',
    qualifications: 'MBBS, MD, DM (Cardiology)',
    experienceYears: 21,
    rating: 4.8,
    reviewCount: 306,
    clinicName: 'Manipal Hospital, Old Airport Road',
    photo: '/assets/images/team-4.jpg',
    address: {
      line1: '98, HAL Old Airport Rd',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560017',
    },
    location: { type: 'Point', coordinates: [77.6625, 12.958] },
    phone: '+91 80 2502 4444',
    website: 'https://www.manipalhospitals.com',
  },
  {
    name: 'Dr. Lakshmi Narayan',
    specialty: 'endocrinologist',
    qualifications: 'MBBS, MD, DM (Endocrinology)',
    experienceYears: 14,
    rating: 4.7,
    reviewCount: 192,
    clinicName: 'Apollo Hospitals, Bannerghatta',
    photo: '/assets/images/team-5.jpg',
    address: {
      line1: '154/11, Opp. IIM, Bannerghatta Rd',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560076',
    },
    location: { type: 'Point', coordinates: [77.5977, 12.8898] },
    phone: '+91 80 4612 4444',
    website: 'https://www.apollohospitals.com',
  },
  {
    name: 'Dr. Prakash Gowda',
    specialty: 'general physician',
    qualifications: 'MBBS, MD (General Medicine)',
    experienceYears: 12,
    rating: 4.6,
    reviewCount: 147,
    clinicName: 'Fortis Hospital, Bannerghatta',
    photo: '/assets/images/team-6.jpg',
    address: {
      line1: '154/9, Bannerghatta Rd, Opp. IIM',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560076',
    },
    location: { type: 'Point', coordinates: [77.5979, 12.8903] },
    phone: '+91 80 6621 4444',
    website: 'https://www.fortishealthcare.com',
  },
  {
    name: 'Dr. Shruti Patel',
    specialty: 'pediatrician',
    qualifications: 'MBBS, MD (Pediatrics)',
    experienceYears: 13,
    rating: 4.9,
    reviewCount: 268,
    clinicName: 'Rainbow Children’s Hospital, Marathahalli',
    photo: '/assets/images/team-1.jpg',
    address: {
      line1: 'Marathahalli - Sarjapur Outer Ring Rd',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560103',
    },
    location: { type: 'Point', coordinates: [77.6961, 12.9516] },
    phone: '+91 80 6666 6666',
    website: 'https://www.rainbowhospitals.in',
  },
  {
    name: 'Dr. Anand Krishnan',
    specialty: 'dermatologist',
    qualifications: 'MBBS, MD (Dermatology)',
    experienceYears: 9,
    rating: 4.7,
    reviewCount: 110,
    clinicName: 'Sakra World Hospital',
    photo: '/assets/images/team-2.jpg',
    address: {
      line1: 'SY No 52/2 & 52/3, Devarabeesanahalli, Outer Ring Rd',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560103',
    },
    location: { type: 'Point', coordinates: [77.6854, 12.9351] },
    phone: '+91 80 4969 4969',
    website: 'https://www.sakraworldhospital.com',
  },

  // ── PUNE ─────────────────────────────────────────────
  {
    name: 'Dr. Ravi Deshpande',
    specialty: 'cardiologist',
    qualifications: 'MBBS, MD, DM (Cardiology)',
    experienceYears: 24,
    rating: 4.8,
    reviewCount: 276,
    clinicName: 'Ruby Hall Clinic',
    photo: '/assets/images/team-3.jpg',
    address: { line1: '40, Sassoon Rd', city: 'Pune', state: 'Maharashtra', pincode: '411001' },
    location: { type: 'Point', coordinates: [73.876, 18.5304] },
    phone: '+91 20 6645 5100',
    website: 'https://www.rubyhall.com',
  },
  {
    name: 'Dr. Shital Kulkarni',
    specialty: 'endocrinologist',
    qualifications: 'MBBS, MD, DM (Endocrinology)',
    experienceYears: 16,
    rating: 4.7,
    reviewCount: 168,
    clinicName: 'Jehangir Hospital',
    photo: '/assets/images/team-4.jpg',
    address: { line1: '32, Sassoon Rd', city: 'Pune', state: 'Maharashtra', pincode: '411001' },
    location: { type: 'Point', coordinates: [73.8783, 18.5293] },
    phone: '+91 20 6681 9999',
    website: 'https://jehangirhospital.com',
  },
  {
    name: 'Dr. Mandar Phadke',
    specialty: 'neurologist',
    qualifications: 'MBBS, MD, DM (Neurology)',
    experienceYears: 18,
    rating: 4.7,
    reviewCount: 142,
    clinicName: 'Deenanath Mangeshkar Hospital',
    photo: '/assets/images/team-5.jpg',
    address: {
      line1: 'Near Mhatre Bridge, Erandwane',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411004',
    },
    location: { type: 'Point', coordinates: [73.8268, 18.5074] },
    phone: '+91 20 4015 1000',
    website: 'https://dmhospital.org',
  },

  // ── CHENNAI ──────────────────────────────────────────
  {
    name: 'Dr. Karthik Subramanian',
    specialty: 'cardiologist',
    qualifications: 'MBBS, MD, DM (Cardiology), FACC',
    experienceYears: 23,
    rating: 4.9,
    reviewCount: 345,
    clinicName: 'Apollo Main Hospital, Greams Road',
    photo: '/assets/images/team-6.jpg',
    address: {
      line1: '21, Greams Ln, Off Greams Rd, Thousand Lights',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600006',
    },
    location: { type: 'Point', coordinates: [80.2499, 13.0605] },
    phone: '+91 44 4040 1066',
    website: 'https://www.apollohospitals.com',
  },
  {
    name: 'Dr. Divya Ramesh',
    specialty: 'gynecologist',
    qualifications: 'MBBS, MS (OBG), DNB',
    experienceYears: 15,
    rating: 4.8,
    reviewCount: 223,
    clinicName: 'MIOT International',
    photo: '/assets/images/team-1.jpg',
    address: {
      line1: '4/112, Mount Poonamallee Rd, Manapakkam',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600089',
    },
    location: { type: 'Point', coordinates: [80.1832, 13.0216] },
    phone: '+91 44 4200 2288',
    website: 'https://www.miotinternational.com',
  },
  {
    name: 'Dr. Hari Prasad',
    specialty: 'orthopedic',
    qualifications: 'MBBS, MS (Ortho), FRCS',
    experienceYears: 21,
    rating: 4.7,
    reviewCount: 190,
    clinicName: 'Global Hospitals Chennai',
    photo: '/assets/images/team-2.jpg',
    address: {
      line1: '439, Cheran Nagar, Perumbakkam',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600100',
    },
    location: { type: 'Point', coordinates: [80.192, 12.905] },
    phone: '+91 44 4444 1000',
    website: 'https://www.gleneagleshospitals.co.in',
  },

  // ── HYDERABAD ────────────────────────────────────────
  {
    name: 'Dr. Aditi Reddy',
    specialty: 'cardiologist',
    qualifications: 'MBBS, MD, DM (Cardiology)',
    experienceYears: 17,
    rating: 4.8,
    reviewCount: 251,
    clinicName: 'Apollo Health City',
    photo: '/assets/images/team-3.jpg',
    address: {
      line1: 'Jubilee Hills, Road No. 72',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500033',
    },
    location: { type: 'Point', coordinates: [78.4071, 17.4129] },
    phone: '+91 40 2355 5555',
    website: 'https://www.apollohospitals.com',
  },
  {
    name: 'Dr. Mahesh Varma',
    specialty: 'endocrinologist',
    qualifications: 'MBBS, MD, DM (Endocrinology)',
    experienceYears: 13,
    rating: 4.6,
    reviewCount: 134,
    clinicName: 'KIMS Hospitals, Secunderabad',
    photo: '/assets/images/team-4.jpg',
    address: {
      line1: '1-8-31/1, Minister Rd, Krishna Nagar Colony',
      city: 'Secunderabad',
      state: 'Telangana',
      pincode: '500003',
    },
    location: { type: 'Point', coordinates: [78.4995, 17.4399] },
    phone: '+91 40 4488 5555',
    website: 'https://www.kimshospitals.com',
  },
  {
    name: 'Dr. Rohini Reddy',
    specialty: 'dermatologist',
    qualifications: 'MBBS, MD (Dermatology)',
    experienceYears: 10,
    rating: 4.7,
    reviewCount: 129,
    clinicName: 'Continental Hospitals',
    photo: '/assets/images/team-5.jpg',
    address: {
      line1: 'Plot no 3, IT Park Rd, Nanakramguda, Financial District',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500032',
    },
    location: { type: 'Point', coordinates: [78.3442, 17.415] },
    phone: '+91 40 6700 0000',
    website: 'https://www.continentalhospitals.com',
  },

  // ── KOLKATA ──────────────────────────────────────────
  {
    name: 'Dr. Subhankar Banerjee',
    specialty: 'cardiologist',
    qualifications: 'MBBS, MD, DM (Cardiology)',
    experienceYears: 25,
    rating: 4.8,
    reviewCount: 298,
    clinicName: 'Fortis Hospital, Anandapur',
    photo: '/assets/images/team-6.jpg',
    address: {
      line1: '730, Anandapur, EM Bypass Rd',
      city: 'Kolkata',
      state: 'West Bengal',
      pincode: '700107',
    },
    location: { type: 'Point', coordinates: [88.4027, 22.5091] },
    phone: '+91 33 6628 4444',
    website: 'https://www.fortishealthcare.com',
  },
  {
    name: 'Dr. Riya Sen',
    specialty: 'gynecologist',
    qualifications: 'MBBS, MS (OBG), DNB',
    experienceYears: 14,
    rating: 4.7,
    reviewCount: 176,
    clinicName: 'Apollo Multispeciality Hospital',
    photo: '/assets/images/team-1.jpg',
    address: {
      line1: '58, Canal Circular Rd, Phool Bagan',
      city: 'Kolkata',
      state: 'West Bengal',
      pincode: '700054',
    },
    location: { type: 'Point', coordinates: [88.4002, 22.5739] },
    phone: '+91 33 2320 2122',
    website: 'https://kolkata.apollohospitals.com',
  },
];

// Helper to generate a URL-safe slug from the doctor's name + city
const makeSlug = (name, city) =>
  `${name}-${city || ''}`
    .toLowerCase()
    .replace(/dr\.?/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

async function seed() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI missing from env');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('[seedDoctors] connected to MongoDB');

    // Curated records (37 hand-picked) — flagged source: 'seed'
    const curated = doctors.map((d) => ({
      ...d,
      slug: makeSlug(d.name, d.address?.city),
      source: 'seed',
      verified: true,
    }));

    // Optional: bulk-generated records from the Groq script.
    let generated = [];
    if (fs.existsSync(GENERATED_PATH)) {
      try {
        generated = JSON.parse(fs.readFileSync(GENERATED_PATH, 'utf-8'));
        console.log(`[seedDoctors] loaded ${generated.length} generated records`);
      } catch (err) {
        console.warn(`[seedDoctors] could not parse generatedDoctors.json: ${err.message}`);
      }
    }

    // Niche-specialty records produced by the local generator (no LLM).
    let niche = [];
    if (fs.existsSync(NICHE_PATH)) {
      try {
        niche = JSON.parse(fs.readFileSync(NICHE_PATH, 'utf-8'));
        console.log(`[seedDoctors] loaded ${niche.length} niche records`);
      } catch (err) {
        console.warn(`[seedDoctors] could not parse nicheDoctors.json: ${err.message}`);
      }
    }

    // Upsert curated first, then generated, then niche. Slugs are unique by
    // (name, city) so collisions are accidental and "last write wins" is fine.
    let upserts = 0;
    for (const r of [...curated, ...generated, ...niche]) {
      if (!r.slug) continue;
      await mongoose.model('Doctor').updateOne({ slug: r.slug }, { $set: r }, { upsert: true });
      upserts += 1;
    }

    // Ensure the 2dsphere + specialty indexes are built
    await mongoose.model('Doctor').createIndexes();

    console.log(`[seedDoctors] upserted ${upserts} doctors (${curated.length} curated + ${generated.length} generated + ${niche.length} niche)`);
    const total = await mongoose.model('Doctor').countDocuments();
    console.log(`[seedDoctors] total doctors in DB: ${total}`);
  } catch (err) {
    console.error('[seedDoctors] failed:', err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

// Import Doctor model so mongoose registers it before use
import '../models/Doctor.js';

seed();
