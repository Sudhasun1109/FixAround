const { Router } = require('express');
const invoiceController = require('../controllers/invoice.controller');
const { verifyToken } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { ROLES } = require('../utils/constants');

const router = Router();

// My invoices
router.get('/my-invoices', verifyToken, authorize(ROLES.CUSTOMER), invoiceController.getMyInvoices);

// Booking invoice
router.get('/bookings/:id/invoice', verifyToken, invoiceController.getByBooking);

// Invoice by ID
router.get('/invoices/:id(\\d+)', verifyToken, invoiceController.getById);
router.get('/:id(\\d+)', verifyToken, invoiceController.getById);

module.exports = router;
