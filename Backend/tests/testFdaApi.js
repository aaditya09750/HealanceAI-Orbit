/**
 * Test script for FDA API Medicine Information Bot
 *
 * This script tests the FDA API integration by searching for common medicines
 * Run: node Backend/tests/testFdaApi.js
 */

import { searchDrugInfo, formatDrugResponse } from '../utils/fdaApi.js';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

// Test medicines
const testMedicines = [
  'aspirin',
  'ibuprofen',
  'acetaminophen',
  'metformin',
  'lisinopril',
  'atorvastatin',
  'amoxicillin',
  'albuterol',
  'losartan',
  'gabapentin',
];

// Helper function to print section headers
function printHeader(text) {
  console.log(`\n${colors.cyan}${colors.bold}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}${text}${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}${'='.repeat(60)}${colors.reset}\n`);
}

// Helper function to print success
function printSuccess(text) {
  console.log(`${colors.green}✓ ${text}${colors.reset}`);
}

// Helper function to print error
function printError(text) {
  console.log(`${colors.red}✗ ${text}${colors.reset}`);
}

// Helper function to print info
function printInfo(text) {
  console.log(`${colors.blue}ℹ ${text}${colors.reset}`);
}

// Helper function to print warning
function printWarning(text) {
  console.log(`${colors.yellow}⚠ ${text}${colors.reset}`);
}

// Test a single medicine
async function testMedicine(medicineName) {
  console.log(`${colors.bold}Testing: ${medicineName}${colors.reset}`);
  console.log('-'.repeat(60));

  try {
    const result = await searchDrugInfo(medicineName);

    if (result.found) {
      printSuccess('Medicine found in FDA database');

      // Print basic info
      if (result.brand_name) {
        printInfo(`Brand Name: ${result.brand_name}`);
      }
      if (result.generic_name) {
        printInfo(`Generic Name: ${result.generic_name}`);
      }
      if (result.manufacturer) {
        printInfo(`Manufacturer: ${result.manufacturer}`);
      }

      // Print sample of detailed info
      if (result.purpose) {
        const preview = result.purpose.substring(0, 100);
        printInfo(`Purpose: ${preview}${result.purpose.length > 100 ? '...' : ''}`);
      }

      if (result.warnings) {
        const preview = result.warnings.substring(0, 100);
        printWarning(`Warnings: ${preview}${result.warnings.length > 100 ? '...' : ''}`);
      }

      // Test formatting
      const formattedResponse = formatDrugResponse(result);
      if (formattedResponse && formattedResponse.length > 0) {
        printSuccess('Response formatted successfully');
        console.log(`${colors.yellow}Character count: ${formattedResponse.length}${colors.reset}`);
      }
    } else {
      printError('Medicine not found in FDA database');
      printInfo(`Reason: ${result.message || 'Unknown'}`);
    }
  } catch (error) {
    printError(`Error: ${error.message}`);
  }

  console.log('\n');
}

// Test all medicines
async function runAllTests() {
  printHeader('FDA API Medicine Information Bot - Test Suite');

  console.log(`${colors.blue}Testing ${testMedicines.length} common medicines...${colors.reset}\n`);

  let successCount = 0;
  let failCount = 0;

  for (const medicine of testMedicines) {
    try {
      const result = await searchDrugInfo(medicine);
      if (result.found) {
        successCount++;
        await testMedicine(medicine);
      } else {
        failCount++;
        await testMedicine(medicine);
      }
    } catch (error) {
      failCount++;
      printError(`Failed to test ${medicine}: ${error.message}`);
    }

    // Add a small delay to respect API rate limits
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Print summary
  printHeader('Test Summary');
  console.log(`${colors.green}Success: ${successCount}/${testMedicines.length}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failCount}/${testMedicines.length}${colors.reset}`);
  console.log(
    `${colors.yellow}Success Rate: ${((successCount / testMedicines.length) * 100).toFixed(1)}%${colors.reset}\n`
  );
}

// Test a specific medicine with detailed output
async function testMedicineDetailed(medicineName) {
  printHeader(`Detailed Test: ${medicineName.toUpperCase()}`);

  try {
    const result = await searchDrugInfo(medicineName);

    if (result.found) {
      printSuccess('Medicine found in FDA database\n');

      // Print all available fields
      console.log('📋 Complete Drug Information:');
      console.log('-'.repeat(60));

      const fields = [
        { key: 'brand_name', label: '💊 Brand Name' },
        { key: 'generic_name', label: '🔬 Generic Name' },
        { key: 'manufacturer', label: '🏭 Manufacturer' },
        { key: 'purpose', label: '📋 Purpose' },
        { key: 'active_ingredients', label: '💉 Active Ingredients' },
        { key: 'dosage', label: '💊 Dosage & Administration' },
        { key: 'warnings', label: '⚠️ Warnings' },
        { key: 'adverse_reactions', label: '🩺 Adverse Reactions' },
        { key: 'drug_interactions', label: '⚕️ Drug Interactions' },
        { key: 'contraindications', label: '🚫 Contraindications' },
        { key: 'storage', label: '📦 Storage' },
        { key: 'description', label: '📄 Description' },
      ];

      for (const field of fields) {
        if (result[field.key]) {
          console.log(`\n${colors.cyan}${field.label}:${colors.reset}`);
          const content = result[field.key];
          const preview = content.length > 200 ? content.substring(0, 200) + '...' : content;
          console.log(preview);
        }
      }

      // Print formatted response
      console.log(`\n${colors.bold}Formatted Response for Chatbot:${colors.reset}`);
      console.log('-'.repeat(60));
      const formattedResponse = formatDrugResponse(result);
      console.log(formattedResponse);
    } else {
      printError('Medicine not found in FDA database');
      console.log(`\nReason: ${result.message || 'Unknown'}`);
    }
  } catch (error) {
    printError(`Error: ${error.message}`);
    console.error(error);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // Run all tests
    await runAllTests();
  } else if (args[0] === '--detailed' && args[1]) {
    // Test specific medicine with detailed output
    await testMedicineDetailed(args[1]);
  } else if (args[0] === '--help') {
    console.log(`
${colors.cyan}${colors.bold}FDA API Medicine Information Bot - Test Script${colors.reset}

${colors.yellow}Usage:${colors.reset}
  node Backend/tests/testFdaApi.js                    # Run all tests
  node Backend/tests/testFdaApi.js --detailed aspirin # Test specific medicine with details
  node Backend/tests/testFdaApi.js --help            # Show this help

${colors.yellow}Examples:${colors.reset}
  node Backend/tests/testFdaApi.js
  node Backend/tests/testFdaApi.js --detailed ibuprofen
  node Backend/tests/testFdaApi.js --detailed metformin

${colors.yellow}Test Medicines:${colors.reset}
  ${testMedicines.join(', ')}
`);
  } else {
    // Test specific medicine
    await testMedicine(args[0]);
  }
}

// Run the script
main().catch((error) => {
  printError('Test script failed');
  console.error(error);
  process.exit(1);
});
