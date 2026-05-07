/**
 * Deterministic local generator for niche-specialty doctors.
 *
 * No LLM, no network. Produces a stable dataset using a seeded PRNG so
 * re-running yields the same output (good for diff-friendly commits).
 *
 * Covers 9 niche specialties across the 8 top metros where these
 * super-specialists actually concentrate:
 *   neurosurgeon, neurologist, plastic surgeon, urologist,
 *   gastroenterologist, psychiatrist, oncologist, nephrologist,
 *   general surgeon
 *
 * Cities: Mumbai, Delhi, Gurugram, Bangalore, Pune, Chennai, Hyderabad,
 * Kolkata.
 *
 * Output: Backend/data/nicheDoctors.json (loaded by seedDoctors.js).
 *
 * Run: cd Backend && node seeds/generateNicheDoctorsLocal.js
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ALIASES_PATH = path.resolve(__dirname, '../data/cityAliases.json');
const OUT_PATH = path.resolve(__dirname, '../data/nicheDoctors.json');

const aliasData = JSON.parse(fs.readFileSync(ALIASES_PATH, 'utf-8'));
const METROS = aliasData.metros;

// ── Seeded PRNG (mulberry32) so output is stable run-to-run ──
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(42);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const rint = (min, max) => Math.floor(rnd() * (max - min + 1)) + min;
const rfloat = (min, max, decimals = 1) => {
  const v = rnd() * (max - min) + min;
  const f = 10 ** decimals;
  return Math.round(v * f) / f;
};

// ── Indian first + last names (mix of regions) ──
const FIRST_NAMES = [
  'Aarav', 'Aditi', 'Aditya', 'Ajay', 'Akshay', 'Alok', 'Aman', 'Amit', 'Anand', 'Anil',
  'Anita', 'Anjali', 'Ankit', 'Anuj', 'Anuradha', 'Aparna', 'Aravind', 'Archana', 'Arjun', 'Arun',
  'Asha', 'Ashish', 'Ashok', 'Avinash', 'Bhavna', 'Chitra', 'Deepa', 'Deepak', 'Dheeraj', 'Dinesh',
  'Divya', 'Faisal', 'Farah', 'Gaurav', 'Geeta', 'Girish', 'Gopal', 'Hari', 'Harish', 'Hemant',
  'Indira', 'Ishaan', 'Jaya', 'Kabir', 'Kamal', 'Karan', 'Kavita', 'Kiran', 'Krishna', 'Lakshmi',
  'Lalit', 'Madhav', 'Manish', 'Manju', 'Manoj', 'Maya', 'Meena', 'Meera', 'Mohan', 'Mohit',
  'Mukesh', 'Nalini', 'Nandini', 'Naveen', 'Neeraj', 'Neha', 'Nikhil', 'Nisha', 'Nitin', 'Pankaj',
  'Pavan', 'Pooja', 'Prabha', 'Pradeep', 'Prakash', 'Pramod', 'Pranav', 'Prashant', 'Pratima', 'Praveen',
  'Preeti', 'Priya', 'Rahul', 'Raj', 'Rajesh', 'Rajiv', 'Rakesh', 'Ramesh', 'Rashmi', 'Ravi',
  'Rekha', 'Rohan', 'Rohit', 'Roshan', 'Sachin', 'Sameer', 'Sandeep', 'Sangeeta', 'Sanjay', 'Sanjeev',
  'Santosh', 'Sapna', 'Sarita', 'Saumya', 'Seema', 'Shalini', 'Shankar', 'Sharad', 'Sharmila', 'Shashi',
  'Sheetal', 'Shikha', 'Shreya', 'Shubha', 'Shyam', 'Siddharth', 'Smita', 'Sridhar', 'Srinivas', 'Subhash',
  'Sudhir', 'Sumit', 'Sunil', 'Suresh', 'Sushil', 'Sushma', 'Swati', 'Tarun', 'Uday', 'Umesh',
  'Usha', 'Varun', 'Veena', 'Venkat', 'Vidya', 'Vijay', 'Vikas', 'Vikram', 'Vinay', 'Vinod',
  'Vishal', 'Vivek', 'Yash', 'Yogesh',
];
const LAST_NAMES = [
  'Sharma', 'Verma', 'Gupta', 'Patel', 'Mehta', 'Shah', 'Desai', 'Joshi', 'Kapoor', 'Khanna',
  'Malhotra', 'Singh', 'Bhatia', 'Khurana', 'Khan', 'Iyer', 'Iyengar', 'Krishnan', 'Menon', 'Nair',
  'Pillai', 'Reddy', 'Rao', 'Naidu', 'Murthy', 'Banerjee', 'Bhattacharya', 'Chatterjee', 'Mukherjee', 'Roy',
  'Das', 'Dutta', 'Sen', 'Bose', 'Patil', 'Deshmukh', 'Kulkarni', 'Phadke', 'Gokhale', 'Yadav',
  'Mishra', 'Pandey', 'Tiwari', 'Trivedi', 'Tripathi', 'Dixit', 'Saxena', 'Agarwal', 'Bansal', 'Mittal',
  'Goyal', 'Garg', 'Aggarwal', 'Jain', 'Modi', 'Doshi', 'Vyas', 'Pandit', 'Kothari', 'Parekh',
  'Choudhary', 'Suri', 'Chopra', 'Bedi', 'Anand', 'Arora', 'Sethi', 'Kohli', 'Bhardwaj', 'Saini',
];

// ── Specialty-keyed qualifications (super-specialty paths) ──
const QUALIFICATIONS = {
  neurosurgeon: [
    'MBBS, MS (Surgery), MCh (Neurosurgery)',
    'MBBS, MS, MCh (Neurosurgery), Fellowship Skull Base Surgery',
    'MBBS, MS (Surgery), DNB (Neurosurgery)',
    'MBBS, MS, MCh (Neurosurgery), FRCS (UK)',
  ],
  neurologist: [
    'MBBS, MD (Medicine), DM (Neurology)',
    'MBBS, MD, DM (Neurology), Fellowship Stroke Medicine',
    'MBBS, MD (Medicine), DNB (Neurology)',
    'MBBS, MD, DM (Neurology), Fellowship Epilepsy',
  ],
  'plastic surgeon': [
    'MBBS, MS (Surgery), MCh (Plastic Surgery)',
    'MBBS, MS, MCh (Plastic Surgery), Fellowship Cosmetic Surgery',
    'MBBS, MS (Surgery), DNB (Plastic Surgery)',
    'MBBS, MS, MCh (Plastic & Reconstructive Surgery)',
  ],
  urologist: [
    'MBBS, MS (Surgery), MCh (Urology)',
    'MBBS, MS, MCh (Urology), Fellowship Andrology',
    'MBBS, MS (Surgery), DNB (Urology)',
    'MBBS, MS, MCh (Urology), Fellowship Renal Transplant',
  ],
  gastroenterologist: [
    'MBBS, MD (Medicine), DM (Gastroenterology)',
    'MBBS, MD, DM (Gastroenterology), Fellowship Hepatology',
    'MBBS, MD (Medicine), DNB (Gastroenterology)',
    'MBBS, MD, DM (Gastroenterology), Fellowship Advanced Endoscopy',
  ],
  psychiatrist: [
    'MBBS, MD (Psychiatry)',
    'MBBS, MD (Psychiatry), DPM',
    'MBBS, MD (Psychiatry), Fellowship Child & Adolescent Psychiatry',
    'MBBS, MD (Psychiatry), Fellowship Addiction Medicine',
  ],
  oncologist: [
    'MBBS, MD (Medicine), DM (Medical Oncology)',
    'MBBS, MD (Radiotherapy), Fellowship Radiation Oncology',
    'MBBS, MS (Surgery), MCh (Surgical Oncology)',
    'MBBS, MD, DM (Medical Oncology), Fellowship Hemato-Oncology',
  ],
  nephrologist: [
    'MBBS, MD (Medicine), DM (Nephrology)',
    'MBBS, MD, DM (Nephrology), Fellowship Renal Transplant',
    'MBBS, MD (Medicine), DNB (Nephrology)',
    'MBBS, MD, DM (Nephrology), Fellowship Critical Care Nephrology',
  ],
  'general surgeon': [
    'MBBS, MS (General Surgery)',
    'MBBS, MS (General Surgery), FRCS (UK)',
    'MBBS, MS (General Surgery), Fellowship Laparoscopic Surgery',
    'MBBS, MS (General Surgery), FACS',
  ],
};

// ── Hospital pools per city (real chain hospitals + plausible specialty centres) ──
const CITY_HOSPITALS = {
  mumbai: [
    'Lilavati Hospital', 'Hinduja Hospital', 'Jaslok Hospital', 'Kokilaben Dhirubhai Ambani Hospital',
    'Bombay Hospital', 'Tata Memorial Hospital', 'Saifee Hospital', 'Breach Candy Hospital',
    'Wockhardt Hospital, Mira Road', 'Fortis Hospital, Mulund', 'Apollo Spectra, Tardeo',
    'Nanavati Max Hospital', 'P. D. Hinduja National Hospital', 'Sir H. N. Reliance Foundation Hospital',
    'Asian Heart Institute', 'Holy Family Hospital, Bandra',
  ],
  delhi: [
    'AIIMS', 'Sir Ganga Ram Hospital', 'BLK Super Specialty Hospital', 'Max Smart Super Specialty',
    'Apollo Hospital, Sarita Vihar', 'Indraprastha Apollo Hospital', 'Fortis Escorts Heart Institute',
    'Moolchand Medcity', 'Holy Family Hospital', 'St. Stephen\'s Hospital',
    'Action Cancer Hospital', 'Jaipur Golden Hospital', 'Primus Super Specialty', 'Aakash Healthcare',
  ],
  gurugram: [
    'Medanta - The Medicity', 'Fortis Memorial Research Institute', 'Artemis Hospital',
    'Max Hospital, Gurgaon', 'Paras Hospital', 'Columbia Asia Hospital, Palam Vihar',
    'Kalra Hospital, Kirti Nagar', 'CK Birla Hospital', 'Park Hospital', 'W Pratiksha Hospital',
  ],
  bangalore: [
    'Manipal Hospital, HAL Airport Road', 'Apollo Hospitals, Bannerghatta', 'Fortis Hospital, Bannerghatta',
    'Narayana Health City', 'Columbia Asia Hospital, Whitefield', 'Sakra World Hospital',
    'Aster CMI Hospital', 'BGS Gleneagles Global Hospital', 'Vikram Hospital', 'St. John\'s Medical College',
    'Sparsh Hospital', 'HCG Cancer Centre', 'Ramaiah Memorial Hospital', 'People Tree Hospitals',
  ],
  pune: [
    'Ruby Hall Clinic', 'Jehangir Hospital', 'Sahyadri Super Specialty Hospital',
    'Aditya Birla Memorial Hospital', 'Deenanath Mangeshkar Hospital', 'Poona Hospital',
    'Inamdar Multispecialty Hospital', 'Sancheti Hospital', 'Columbia Asia Hospital, Kharadi',
    'Manipal Hospital, Baner', 'Noble Hospital', 'KEM Hospital, Pune',
  ],
  chennai: [
    'Apollo Hospitals, Greams Road', 'Fortis Malar Hospital', 'MIOT International',
    'Kauvery Hospital', 'Global Hospitals, Perumbakkam', 'Sri Ramachandra Medical Centre',
    'Vijaya Hospital', 'Madras Medical Mission', 'Cancer Institute, Adyar',
    'SIMS Hospital', 'Sankara Nethralaya', 'Sundaram Medical Foundation',
  ],
  hyderabad: [
    'Apollo Hospitals, Jubilee Hills', 'Yashoda Hospitals', 'KIMS Hospital',
    'Continental Hospitals', 'AIG Hospitals', 'Care Hospitals',
    'MaxCure Hospitals', 'Sunshine Hospital', 'Aware Gleneagles Global Hospital',
    'Citizens Specialty Hospital', 'Basavatarakam Indo American Cancer Hospital',
  ],
  kolkata: [
    'AMRI Hospitals', 'Apollo Gleneagles Hospital', 'Fortis Hospital, Anandapur',
    'Belle Vue Clinic', 'Ruby General Hospital', 'Peerless Hospital',
    'Tata Medical Center', 'Woodlands Multispeciality Hospital', 'CMRI - The Calcutta Medical Research Institute',
    'B M Birla Heart Research Centre', 'Medica Superspecialty Hospital',
  ],
};

// ── Pincode prefixes per city (first 4 digits, last 2 randomized) ──
const PINCODE_BASES = {
  mumbai: ['4000', '4001'],
  delhi: ['1100'],
  gurugram: ['1220'],
  bangalore: ['5600'],
  pune: ['4110'],
  chennai: ['6000', '6001'],
  hyderabad: ['5000'],
  kolkata: ['7000'],
};

// ── Common Mumbai/Indian street/area words for line1 ──
const STREET_WORDS = [
  'Marg', 'Road', 'Cross Road', 'Lane', 'Avenue', 'Nagar', 'Colony', 'Society', 'Plaza',
];

const STATE_INDIA = {
  mumbai: 'Maharashtra',
  delhi: 'Delhi',
  gurugram: 'Haryana',
  bangalore: 'Karnataka',
  pune: 'Maharashtra',
  chennai: 'Tamil Nadu',
  hyderabad: 'Telangana',
  kolkata: 'West Bengal',
};

const TOP_METROS = ['mumbai', 'delhi', 'gurugram', 'bangalore', 'pune', 'chennai', 'hyderabad', 'kolkata'];

const NICHE_SPECIALTIES = [
  'neurosurgeon',
  'neurologist',
  'plastic surgeon',
  'urologist',
  'gastroenterologist',
  'psychiatrist',
  'oncologist',
  'nephrologist',
  'general surgeon',
];
const PER_PAIR = 4;

// ── Helpers ──
function slugify(name, cityKey) {
  return `${name}-${cityKey}`
    .toLowerCase()
    .replace(/dr\.?\s+/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function makePincode(cityKey) {
  const base = pick(PINCODE_BASES[cityKey] || ['4000']);
  const tail = String(rint(1, 99)).padStart(2, '0');
  return base + tail;
}

function makePhone() {
  // Indian mobile prefixes
  const startDigits = ['98', '99', '70', '71', '72', '73', '74', '75', '76', '77', '78', '79',
                       '80', '81', '82', '83', '84', '85', '86', '87', '88', '89',
                       '90', '91', '92', '93'];
  const start = pick(startDigits);
  let rest = '';
  for (let i = 0; i < 8; i++) rest += String(rint(0, 9));
  return `+91-${start}${rest}`;
}

function makeAddressLine(cityKey) {
  const num = rint(1, 220);
  const word = pick(['MG', 'JN', 'SV', 'Linking', 'Hill', 'Park', 'Ring', 'New', 'Old', 'Station',
                     'Hospital', 'Bank', 'Civil Lines', 'Sector', 'Outer', 'Inner']);
  const street = pick(STREET_WORDS);
  return `${num}, ${word} ${street}`;
}

function makeJitter(center) {
  // ±0.05 jitter around city center
  return Number((center + (rnd() - 0.5) * 0.1).toFixed(6));
}

function generateDoctor(cityKey, specialty) {
  const metro = METROS[cityKey];
  const first = pick(FIRST_NAMES);
  const last = pick(LAST_NAMES);
  const name = `Dr. ${first} ${last}`;
  return {
    name,
    slug: slugify(name, cityKey),
    specialty,
    qualifications: pick(QUALIFICATIONS[specialty]),
    experienceYears: rint(8, 35),
    rating: rfloat(4.0, 4.9),
    reviewCount: rint(30, 600),
    clinicName: pick(CITY_HOSPITALS[cityKey] || [`${metro.name} ${specialty} Centre`]),
    photo: '',
    address: {
      line1: makeAddressLine(cityKey),
      city: metro.name,
      state: STATE_INDIA[cityKey] || '',
      country: 'India',
      pincode: makePincode(cityKey),
    },
    location: {
      type: 'Point',
      coordinates: [makeJitter(metro.lon), makeJitter(metro.lat)],
    },
    phone: makePhone(),
    email: '',
    website: '',
    acceptsNewPatients: true,
    verified: false,
    source: 'generated',
  };
}

function main() {
  const records = [];
  const seen = new Set();
  for (const cityKey of TOP_METROS) {
    for (const specialty of NICHE_SPECIALTIES) {
      let added = 0;
      let attempts = 0;
      while (added < PER_PAIR && attempts < 20) {
        attempts++;
        const doc = generateDoctor(cityKey, specialty);
        if (seen.has(doc.slug)) continue; // collision: try a different name
        seen.add(doc.slug);
        records.push(doc);
        added++;
      }
    }
  }

  fs.writeFileSync(OUT_PATH, JSON.stringify(records, null, 2));

  // Stats
  const cityCounts = {};
  const specCounts = {};
  for (const r of records) {
    cityCounts[r.address.city] = (cityCounts[r.address.city] || 0) + 1;
    specCounts[r.specialty] = (specCounts[r.specialty] || 0) + 1;
  }
  console.log(`[generateNicheLocal] wrote ${records.length} records to ${OUT_PATH}`);
  console.log('cities:');
  for (const [c, n] of Object.entries(cityCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${c}: ${n}`);
  }
  console.log('specialties:');
  for (const [s, n] of Object.entries(specCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${s}: ${n}`);
  }
}

main();
