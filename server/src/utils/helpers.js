const crypto = require('crypto');

/**
 * Generate a random alphanumeric string
 * @param {number} length
 * @returns {string}
 */
function randomString(length = 6) {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length)
    .toUpperCase();
}

/**
 * Format date as YYYYMMDD in UTC
 * @param {Date} date
 * @returns {string}
 */
function formatDateUtc(date = new Date()) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

/**
 * Generate unique booking number (e.g., BK-20261017-AB12)
 * Max length <= 20
 * @returns {string}
 */
function generateBookingNumber() {
  const dateStr = formatDateUtc();
  const rand = randomString(6);
  return `BK-${dateStr}-${rand}`;
}

/**
 * Generate unique payment number (e.g., PAY-20261017-AB12CD)
 * Max length <= 30
 * @returns {string}
 */
function generatePaymentNumber() {
  const dateStr = formatDateUtc();
  const rand = randomString(8);
  return `PAY-${dateStr}-${rand}`;
}

/**
 * Generate unique invoice number (e.g., INV-20261017-AB12CD)
 * Max length <= 30
 * @returns {string}
 */
function generateInvoiceNumber() {
  const dateStr = formatDateUtc();
  const rand = randomString(8);
  return `INV-${dateStr}-${rand}`;
}

/**
 * Generate unique claim number (e.g., CLM-20261017-AB12CD)
 * Max length <= 30
 * @returns {string}
 */
function generateClaimNumber() {
  const dateStr = formatDateUtc();
  const rand = randomString(8);
  return `CLM-${dateStr}-${rand}`;
}

/**
 * Generate unique refund number (e.g., REF-20261017-AB12CD)
 * Max length <= 30
 * @returns {string}
 */
function generateRefundNumber() {
  const dateStr = formatDateUtc();
  const rand = randomString(8);
  return `REF-${dateStr}-${rand}`;
}

/**
 * Calculate Haversine distance between two coordinates in kilometers
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} Distance in kilometers (rounded to 2 decimal places)
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) {
    return Infinity;
  }

  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371; // Earth's radius in kilometers

  const dLat = toRad(Number(lat2) - Number(lat1));
  const dLon = toRad(Number(lon2) - Number(lon1));

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(Number(lat1))) *
      Math.cos(toRad(Number(lat2))) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100;
}

/**
 * Format currency amount to 2 decimal places
 * @param {number|string} amount
 * @returns {string}
 */
function formatCurrency(amount) {
  const numeric = typeof amount === 'number' ? amount : parseFloat(amount || '0');
  return numeric.toFixed(2);
}

/**
 * Sanitize user object by removing sensitive fields (password_hash)
 * @param {Object} user
 * @returns {Object}
 */
function sanitizeUser(user) {
  if (!user) return null;
  const sanitized = { ...user };
  delete sanitized.password_hash;
  return sanitized;
}

/**
 * Format an ISO UTC date string
 * @param {Date|string|number} date
 * @returns {string}
 */
function toUtcIso(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

module.exports = {
  generateBookingNumber,
  generatePaymentNumber,
  generateInvoiceNumber,
  generateClaimNumber,
  generateRefundNumber,
  calculateHaversineDistance,
  formatCurrency,
  sanitizeUser,
  toUtcIso
};
