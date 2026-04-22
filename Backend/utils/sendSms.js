import twilio from 'twilio';

const normalizeSmsNumber = (number = '') => {
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

const isValidSmsNumber = (number = '') => {
  return /^\+[1-9]\d{7,14}$/.test(number);
};

const getTwilioClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error(
      'Twilio credentials are missing. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.'
    );
  }

  return twilio(accountSid, authToken);
};

export const sendSms = async ({ to, body }) => {
  const from = process.env.TWILIO_PHONE_NUMBER;
  const normalizedTo = normalizeSmsNumber(to);

  if (!from) {
    throw new Error('TWILIO_PHONE_NUMBER is not configured.');
  }

  if (!isValidSmsNumber(normalizedTo)) {
    throw new Error(
      'Please provide a valid phone number in international format (e.g. +9198XXXXXXXX).'
    );
  }

  if (!body || !String(body).trim()) {
    throw new Error('SMS body is required.');
  }

  const client = getTwilioClient();

  const message = await client.messages.create({
    to: normalizedTo,
    from,
    body: String(body).trim(),
  });

  return {
    sid: message.sid,
    status: message.status,
    to: message.to,
    from: message.from,
  };
};

export { normalizeSmsNumber, isValidSmsNumber };
