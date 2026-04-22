const normalizeWhatsAppNumber = (number = '') => {
  const cleaned = String(number).replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+')) {
    return `+${cleaned.slice(1).replace(/\D/g, '')}`;
  }

  const digitsOnly = cleaned.replace(/\D/g, '');

  if (digitsOnly.length === 10) {
    return `+91${digitsOnly}`;
  }

  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    return `+${digitsOnly}`;
  }

  if (digitsOnly.length > 10) {
    return `+${digitsOnly}`;
  }

  return digitsOnly;
};

const isValidWhatsAppNumber = (number = '') => {
  return /^\+[1-9]\d{7,14}$/.test(number);
};

export const sendWhatsAppLoginOtp = async (to, otp) => {
  const normalizedTo = normalizeWhatsAppNumber(to);

  if (!isValidWhatsAppNumber(normalizedTo)) {
    throw new Error(
      'Please provide a valid WhatsApp number in international format (e.g. +9198XXXXXXXX).'
    );
  }

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    console.warn('WhatsApp credentials are missing. OTP is simulated in non-production mode.');
    return { sent: false, simulated: true };
  }

  const endpoint = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
  const body = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: normalizedTo,
    type: 'text',
    text: {
      body: `Your Healance login OTP is ${otp}. It is valid for 5 minutes. Do not share this code with anyone.`,
    },
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Failed to send WhatsApp OTP. ${details}`);
  }

  return { sent: true, simulated: false };
};

export const sendWhatsAppTextMessage = async (to, message) => {
  const normalizedTo = normalizeWhatsAppNumber(to);

  if (!isValidWhatsAppNumber(normalizedTo)) {
    throw new Error(
      'Please provide a valid WhatsApp number in international format (e.g. +9198XXXXXXXX).'
    );
  }

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    console.warn('WhatsApp credentials are missing. Message is simulated in non-production mode.');
    return { sent: false, simulated: true };
  }

  const endpoint = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
  const body = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: normalizedTo,
    type: 'text',
    text: {
      body: message,
    },
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Failed to send WhatsApp message. ${details}`);
  }

  return { sent: true, simulated: false };
};

export { normalizeWhatsAppNumber, isValidWhatsAppNumber };
