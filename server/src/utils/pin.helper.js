const crypto = require('crypto');
const config = require('../config/env');

const SECRET = config.jwt?.secret || 'fixaround_production_secure_salt_2026';
const KEY = crypto.createHash('sha256').update(SECRET).digest(); // 32 bytes for AES-256

/**
 * Generate a cryptographically secure 4-digit numeric PIN
 * Returns { pin: "4829", packedHash: "hash:iv:authTag:enc" }
 */
function generateCompletionPin(bookingId) {
  // Generate 4-digit PIN between 1000 and 9999
  const pin = crypto.randomInt(1000, 10000).toString();
  
  // SHA-256 hash for fast constant-time verification
  const hash = crypto.createHash('sha256').update(`${pin}_${bookingId}_pin`).digest('hex');
  
  // Encrypt with AES-256-GCM so customer endpoint can retrieve the PIN securely
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  let enc = cipher.update(pin, 'utf8', 'hex');
  enc += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  const packedHash = `${hash}:${iv.toString('hex')}:${authTag}:${enc}`;
  return { pin, packedHash };
}

/**
 * Verify a 4-digit input against the stored packed hash
 */
function verifyPin(inputPin, bookingId, packedHash) {
  if (!inputPin || !packedHash) return false;
  const parts = packedHash.split(':');
  if (parts.length < 4) return false;

  const expectedHash = parts[0];
  const inputHash = crypto.createHash('sha256').update(`${String(inputPin).trim()}_${bookingId}_pin`).digest('hex');

  const expectedBuf = Buffer.from(expectedHash, 'hex');
  const inputBuf = Buffer.from(inputHash, 'hex');

  if (expectedBuf.length !== inputBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, inputBuf);
}

/**
 * Decrypt the PIN for customer delivery
 */
function decryptPin(packedHash) {
  if (!packedHash) return null;
  const parts = packedHash.split(':');
  if (parts.length < 4) return null;

  try {
    const [, ivHex, authTagHex, encHex] = parts;
    const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    let pin = decipher.update(encHex, 'hex', 'utf8');
    pin += decipher.final('utf8');
    return pin;
  } catch (err) {
    console.error('[PIN Decrypt Error]:', err.message);
    return null;
  }
}

module.exports = {
  generateCompletionPin,
  verifyPin,
  decryptPin
};
