export const ROLES = Object.freeze({
  CUSTOMER: 'customer',
  TECHNICIAN: 'technician',
  ADMIN: 'admin',
});

export const BOOKING_STATUSES = Object.freeze({
  REQUESTED: 'REQUESTED',
  ASSIGNED: 'ASSIGNED',
  ACCEPTED: 'ACCEPTED',
  ON_THE_WAY: 'ON_THE_WAY',
  ARRIVED: 'ARRIVED',
  IN_PROGRESS: 'IN_PROGRESS',
  AWAITING_APPROVAL: 'AWAITING_APPROVAL',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  REJECTED: 'REJECTED',
  NO_TECHNICIAN_AVAILABLE: 'NO_TECHNICIAN_AVAILABLE',
  EXPIRED: 'EXPIRED',
  DISPUTED: 'DISPUTED',
});

export const PAYMENT_STATUSES = Object.freeze({
  PENDING: 'PENDING',
  INITIATED: 'INITIATED',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  REFUND_PENDING: 'REFUND_PENDING',
  PARTIALLY_REFUNDED: 'PARTIALLY_REFUNDED',
  REFUNDED: 'REFUNDED',
});

export const ESTIMATE_STATUSES = Object.freeze({
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  REVISED: 'REVISED',
  SUPERSEDED: 'SUPERSEDED',
});

export const CLAIM_STATUSES = Object.freeze({
  OPEN: 'OPEN',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  RESOLVED: 'RESOLVED',
});

export const VERIFICATION_STATUSES = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
});

export const INVOICE_STATUSES = Object.freeze({
  DRAFT: 'DRAFT',
  ISSUED: 'ISSUED',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
});

export const URGENCY_LEVELS = Object.freeze({
  NORMAL: 'normal',
  URGENT: 'urgent',
  EMERGENCY: 'emergency',
});

export const PAYMENT_METHODS = Object.freeze({
  CASH: 'CASH',
  ONLINE: 'ONLINE',
  CARD: 'CARD',
  UPI: 'UPI',
  WALLET: 'WALLET',
  SANDBOX: 'SANDBOX',
});

export const ROLE_LABELS = {
  [ROLES.CUSTOMER]: 'Customer',
  [ROLES.TECHNICIAN]: 'Technician',
  [ROLES.ADMIN]: 'Administrator',
};

export const URGENCY_LABELS = {
  [URGENCY_LEVELS.NORMAL]: 'Standard (Scheduled)',
  [URGENCY_LEVELS.URGENT]: 'Urgent (Within 2 Hours)',
  [URGENCY_LEVELS.EMERGENCY]: 'Emergency (Immediate 30 Min)',
};

export const BOOKING_STATUS_LABELS = {
  [BOOKING_STATUSES.REQUESTED]: 'Requested',
  [BOOKING_STATUSES.ASSIGNED]: 'Technician Assigned',
  [BOOKING_STATUSES.ACCEPTED]: 'Accepted',
  [BOOKING_STATUSES.ON_THE_WAY]: 'On The Way',
  [BOOKING_STATUSES.ARRIVED]: 'Arrived at Location',
  [BOOKING_STATUSES.IN_PROGRESS]: 'Work In Progress',
  [BOOKING_STATUSES.AWAITING_APPROVAL]: 'Estimate Awaiting Approval',
  [BOOKING_STATUSES.COMPLETED]: 'Job Completed',
  [BOOKING_STATUSES.CANCELLED]: 'Cancelled',
  [BOOKING_STATUSES.REJECTED]: 'Rejected',
  [BOOKING_STATUSES.NO_TECHNICIAN_AVAILABLE]: 'No Tech Available',
  [BOOKING_STATUSES.EXPIRED]: 'Expired',
  [BOOKING_STATUSES.DISPUTED]: 'Disputed',
};

export const STATUS_COLORS = {
  // Booking statuses
  [BOOKING_STATUSES.REQUESTED]: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-800',
    dot: 'bg-amber-500',
  },
  [BOOKING_STATUSES.ASSIGNED]: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-800',
    dot: 'bg-blue-500',
  },
  [BOOKING_STATUSES.ACCEPTED]: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    badge: 'bg-indigo-100 text-indigo-800',
    dot: 'bg-indigo-500',
  },
  [BOOKING_STATUSES.ON_THE_WAY]: {
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    badge: 'bg-sky-100 text-sky-800',
    dot: 'bg-sky-500',
  },
  [BOOKING_STATUSES.ARRIVED]: {
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    border: 'border-teal-200',
    badge: 'bg-teal-100 text-teal-800',
    dot: 'bg-teal-500',
  },
  [BOOKING_STATUSES.IN_PROGRESS]: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    badge: 'bg-purple-100 text-purple-800',
    dot: 'bg-purple-500',
  },
  [BOOKING_STATUSES.AWAITING_APPROVAL]: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    badge: 'bg-orange-100 text-orange-800',
    dot: 'bg-orange-500',
  },
  [BOOKING_STATUSES.COMPLETED]: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-800',
    dot: 'bg-emerald-500',
  },
  [BOOKING_STATUSES.CANCELLED]: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    badge: 'bg-rose-100 text-rose-800',
    dot: 'bg-rose-500',
  },
  [BOOKING_STATUSES.REJECTED]: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-800',
    dot: 'bg-red-500',
  },
  [BOOKING_STATUSES.NO_TECHNICIAN_AVAILABLE]: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-800',
    dot: 'bg-red-500',
  },
  [BOOKING_STATUSES.EXPIRED]: {
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-200',
    badge: 'bg-gray-100 text-gray-800',
    dot: 'bg-gray-500',
  },
  [BOOKING_STATUSES.DISPUTED]: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-800',
    dot: 'bg-red-500',
  },

  // Payment statuses
  [PAYMENT_STATUSES.SUCCESS]: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-800',
    dot: 'bg-emerald-500',
  },
  [PAYMENT_STATUSES.PENDING]: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    badge: 'bg-amber-100 text-amber-800',
    dot: 'bg-amber-500',
  },
  [PAYMENT_STATUSES.FAILED]: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    badge: 'bg-rose-100 text-rose-800',
    dot: 'bg-rose-500',
  },
};

export const TIMELINE_STEPS = [
  BOOKING_STATUSES.REQUESTED,
  BOOKING_STATUSES.ASSIGNED,
  BOOKING_STATUSES.ACCEPTED,
  BOOKING_STATUSES.ON_THE_WAY,
  BOOKING_STATUSES.ARRIVED,
  BOOKING_STATUSES.IN_PROGRESS,
  BOOKING_STATUSES.COMPLETED,
];
