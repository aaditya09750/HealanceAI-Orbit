/*
  Usage:
  1) Start backend server
  2) Export token: export HEALANCE_TOKEN="<jwt-token>"
  3) Run: node tests/testPredictApi.js
*/

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';
const TOKEN = process.env.HEALANCE_TOKEN;

if (!TOKEN) {
  console.error('Missing HEALANCE_TOKEN. Export your JWT token first.');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${TOKEN}`,
};

const testCases = [
  {
    name: 'Case 1: Likely Lower Risk',
    endpoint: '/predict/all',
    payload: {
      age: 28,
      gender: 'Female',
      weight: 56,
      height: 165,
      glucose: 92,
      bloodPressure: 112,
      cholesterol: 165,
    },
  },
  {
    name: 'Case 2: Likely Higher Risk',
    endpoint: '/predict/all',
    payload: {
      age: 59,
      gender: 'Male',
      weight: 92,
      height: 168,
      glucose: 178,
      bloodPressure: 156,
      cholesterol: 282,
    },
  },
  {
    name: 'Case 3: Validation Check (Invalid Age)',
    endpoint: '/predict/all',
    payload: {
      age: -1,
      gender: 'Male',
      weight: 72,
      height: 172,
      glucose: 95,
      bloodPressure: 118,
      cholesterol: 180,
    },
  },
];

const run = async () => {
  for (const testCase of testCases) {
    console.log(`\n=== ${testCase.name} ===`);

    try {
      const res = await fetch(`${API_BASE_URL}${testCase.endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(testCase.payload),
      });

      const data = await res.json();
      console.log('Status:', res.status);

      if (res.ok) {
        console.log('Diabetes:', data.diabetes);
        console.log('Heart:', data.heart);
        console.log('BMI:', data.bmi, '| Category:', data.bmiCategory);
        console.log('FBS:', data.fbs);
        console.log('Probabilities:', data.probability);
      } else {
        console.log('Error message:', data.message);
      }
    } catch (error) {
      console.error('Request failed:', error.message);
    }
  }
};

run();
