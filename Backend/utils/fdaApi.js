// FDA API Helper Functions for Medicine Information
// FDA openFDA API: https://open.fda.gov/apis/

const FDA_BASE_URL = 'https://api.fda.gov';

/**
 * Search for drug information from FDA database
 * @param {string} drugName - Name of the medicine/drug
 * @returns {Promise<Object>} - Drug information
 */
export const searchDrugInfo = async (drugName) => {
  try {
    if (!drugName || drugName.trim().length === 0) {
      throw new Error('Drug name is required');
    }

    const cleanDrugName = drugName.trim().toLowerCase();

    // FDA API endpoint for drug labels
    const searchQuery = encodeURIComponent(
      `openfda.brand_name:"${cleanDrugName}" OR openfda.generic_name:"${cleanDrugName}"`
    );
    const url = `${FDA_BASE_URL}/drug/label.json?search=${searchQuery}&limit=1`;

    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        return { found: false, message: 'Medicine not found in FDA database' };
      }
      throw new Error(`FDA API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      return { found: false, message: 'No information found for this medicine' };
    }

    const drugData = data.results[0];

    return {
      found: true,
      data: parseDrugData(drugData),
    };
  } catch (error) {
    console.error('FDA API Error:', error.message);
    return {
      found: false,
      error: error.message,
      message: 'Unable to fetch medicine information at this time',
    };
  }
};

/**
 * Search for drug adverse events
 * @param {string} drugName - Name of the medicine/drug
 * @returns {Promise<Object>} - Adverse events data
 */
export const searchDrugAdverseEvents = async (drugName) => {
  try {
    const cleanDrugName = drugName.trim();
    const searchQuery = encodeURIComponent(`patient.drug.openfda.brand_name:"${cleanDrugName}"`);
    const url = `${FDA_BASE_URL}/drug/event.json?search=${searchQuery}&count=patient.reaction.reactionmeddrapt.exact&limit=10`;

    const response = await fetch(url);

    if (!response.ok) {
      return { found: false };
    }

    const data = await response.json();
    return {
      found: true,
      events: data.results || [],
    };
  } catch (error) {
    console.error('FDA Adverse Events Error:', error.message);
    return { found: false };
  }
};

/**
 * Parse and format FDA drug data
 * @param {Object} drugData - Raw FDA drug data
 * @returns {Object} - Formatted drug information
 */
const parseDrugData = (drugData) => {
  const openfda = drugData.openfda || {};

  return {
    // Basic Information
    brandName: openfda.brand_name?.[0] || 'N/A',
    genericName: openfda.generic_name?.[0] || 'N/A',
    manufacturer: openfda.manufacturer_name?.[0] || 'N/A',

    // Purpose and Uses
    purpose:
      drugData.purpose?.[0] || drugData.indications_and_usage?.[0] || 'Information not available',

    // Dosage and Administration
    dosage: drugData.dosage_and_administration?.[0] || 'Consult your doctor for proper dosage',

    // Warnings and Precautions
    warnings:
      drugData.warnings?.[0] || drugData.boxed_warning?.[0] || 'See package insert for warnings',
    precautions: drugData.precautions?.[0] || 'Consult healthcare provider',

    // Side Effects
    adverseReactions: drugData.adverse_reactions?.[0] || 'See package insert for adverse reactions',

    // Interactions
    drugInteractions:
      drugData.drug_interactions?.[0] || 'Consult your doctor about drug interactions',

    // Contraindications
    contraindications: drugData.contraindications?.[0] || 'See package insert',

    // Storage and Handling
    storage: drugData.storage_and_handling?.[0] || 'Store as directed on package',

    // Route and Product Type
    route: openfda.route?.[0] || 'N/A',
    productType: openfda.product_type?.[0] || 'N/A',

    // Active Ingredient
    activeIngredient: drugData.active_ingredient?.[0] || openfda.substance_name?.[0] || 'N/A',

    // Additional Info
    pediatricUse: drugData.pediatric_use?.[0],
    pregnancy: drugData.pregnancy?.[0] || drugData.teratogenic_effects?.[0],
    nursing: drugData.nursing_mothers?.[0],
  };
};

/**
 * Format drug information for chatbot response
 * @param {Object} drugInfo - Parsed drug information
 * @returns {string} - Formatted response text
 */
export const formatDrugResponse = (drugInfo) => {
  const { data } = drugInfo;

  if (!drugInfo.found) {
    return drugInfo.message || 'Medicine information not available';
  }

  // Clean and format text - removes excess whitespace and newlines
  const cleanText = (text, maxLength = 800) => {
    if (!text || text === 'N/A' || text === 'Information not available') return null;

    // Remove excessive whitespace and newlines
    let cleaned = text.replace(/\s+/g, ' ').trim();

    // Truncate if too long, but try to end at sentence
    if (cleaned.length > maxLength) {
      cleaned = cleaned.substring(0, maxLength);
      const lastPeriod = cleaned.lastIndexOf('.');
      const lastExclamation = cleaned.lastIndexOf('!');
      const lastSentenceEnd = Math.max(lastPeriod, lastExclamation);

      if (lastSentenceEnd > maxLength * 0.7) {
        cleaned = cleaned.substring(0, lastSentenceEnd + 1);
      } else {
        cleaned = cleaned + '...';
      }
    }

    return cleaned;
  };

  // Build formatted response
  let response = '';

  // Header with medicine name
  response += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  response += `💊 **${data.brandName}**\n`;
  if (data.genericName !== 'N/A') {
    response += `📌 *${data.genericName}*\n`;
  }
  response += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  // Purpose & Uses
  const purpose = cleanText(data.purpose, 600);
  if (purpose) {
    response += `**📋 WHAT IT'S FOR:**\n${purpose}\n\n`;
  }

  // Active Ingredient
  const activeIngredient = cleanText(data.activeIngredient, 300);
  if (activeIngredient) {
    response += `**🧪 ACTIVE INGREDIENT:**\n${activeIngredient}\n\n`;
  }

  // Dosage
  const dosage = cleanText(data.dosage, 600);
  if (dosage) {
    response += `**💉 HOW TO USE:**\n${dosage}\n\n`;
  }

  // Warnings (Most Important)
  const warnings = cleanText(data.warnings, 700);
  if (warnings) {
    response += `**⚠️ IMPORTANT WARNINGS:**\n${warnings}\n\n`;
  }

  // Side Effects
  const sideEffects = cleanText(data.adverseReactions, 500);
  if (sideEffects && sideEffects !== 'See package insert for adverse reactions') {
    response += `**🩺 POSSIBLE SIDE EFFECTS:**\n${sideEffects}\n\n`;
  }

  // Drug Interactions
  const interactions = cleanText(data.drugInteractions, 500);
  if (interactions && interactions !== 'Consult your doctor about drug interactions') {
    response += `**⚕️ DRUG INTERACTIONS:**\n${interactions}\n\n`;
  }

  // Contraindications
  const contraindications = cleanText(data.contraindications, 400);
  if (contraindications && contraindications !== 'See package insert') {
    response += `**🚫 DO NOT USE IF:**\n${contraindications}\n\n`;
  }

  // Additional Info
  response += `**ℹ️ ADDITIONAL INFO:**\n`;

  if (data.manufacturer !== 'N/A') {
    response += `• Manufacturer: ${data.manufacturer}\n`;
  }

  if (data.route !== 'N/A') {
    response += `• Route: ${data.route}\n`;
  }

  response += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  response += `**⚠️ MEDICAL DISCLAIMER**\n`;
  response += `This is FDA-approved drug information for educational purposes only. `;
  response += `Always consult your doctor or pharmacist before starting, stopping, or changing any medication. `;
  response += `Call emergency services immediately if you experience severe reactions.\n`;
  response += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  return response;
};

/**
 * Get alternative suggestions when drug is not found
 * @param {string} drugName - Original search term
 * @returns {string} - Helpful response with suggestions
 */
export const getDrugNotFoundResponse = (drugName) => {
  return (
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `❌ **MEDICINE NOT FOUND**\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `I couldn't find detailed FDA information for **"${drugName}"**.\n\n` +
    `**💡 SUGGESTIONS:**\n\n` +
    `✓ Check spelling - Try generic or brand name\n` +
    `✓ Use full medicine name (e.g., "Acetaminophen" not "Aceta")\n\n` +
    `**📋 MEDICINES I CAN SEARCH:**\n\n` +
    `• Pain Relief: Aspirin, Ibuprofen, Acetaminophen, Naproxen\n` +
    `• Antibiotics: Amoxicillin, Azithromycin, Ciprofloxacin\n` +
    `• Heart/BP: Lisinopril, Atorvastatin, Amlodipine, Losartan\n` +
    `• Diabetes: Metformin, Insulin, Glipizide\n` +
    `• Allergy: Cetirizine, Loratadine, Diphenhydramine\n\n` +
    `**🏥 NEED MORE HELP?**\n` +
    `• Consult your pharmacist or doctor\n` +
    `• Visit: www.drugs.com or www.fda.gov\n\n` +
    `Type another medicine name to search!`
  );
};

export default {
  searchDrugInfo,
  searchDrugAdverseEvents,
  formatDrugResponse,
  getDrugNotFoundResponse,
};
