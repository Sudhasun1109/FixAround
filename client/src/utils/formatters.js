import { BOOKING_STATUS_LABELS, STATUS_COLORS } from './constants';

/**
 * Format number as Indian Rupee (₹)
 * @param {number|string} amount
 * @param {boolean} [showDecimals=false]
 */
export function formatCurrency(amount, showDecimals = false) {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return '₹0';
  }
  const num = Number(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(num);
}

/**
 * Format date as DD MMM YYYY (e.g. 15 Oct 2026)
 * @param {string|Date} date
 */
export function formatDate(date) {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

/**
 * Format date and time (e.g. 15 Oct 2026, 04:30 PM)
 * @param {string|Date} date
 */
export function formatDateTime(date) {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

/**
 * Format time relative to now (e.g. 5 minutes ago, 2 hours ago)
 * @param {string|Date} date
 */
export function formatRelativeTime(date) {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';

  const diffMs = Date.now() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

/**
 * Format distance in km
 * @param {number|string} km
 */
export function formatDistance(km) {
  if (km === null || km === undefined || isNaN(Number(km))) return '-';
  const dist = Number(km);
  if (dist < 1) {
    return `${Math.round(dist * 1000)} m away`;
  }
  return `${dist.toFixed(1)} km away`;
}

/**
 * Get human-readable label for a status string
 * @param {string} status
 */
export function getStatusLabel(status) {
  if (!status) return 'Unknown';
  if (BOOKING_STATUS_LABELS[status]) {
    return BOOKING_STATUS_LABELS[status];
  }
  // Convert SNAKE_CASE or camelCase to Title Case
  return status
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get color config object for a status
 * @param {string} status
 */
export function getStatusColor(status) {
  if (!status) {
    return {
      bg: 'bg-slate-50',
      text: 'text-slate-700',
      border: 'border-slate-200',
      badge: 'bg-slate-100 text-slate-800',
      dot: 'bg-slate-400',
    };
  }
  return (
    STATUS_COLORS[status] || {
      bg: 'bg-slate-50',
      text: 'text-slate-700',
      border: 'border-slate-200',
      badge: 'bg-slate-100 text-slate-800',
      dot: 'bg-slate-400',
    }
  );
}
