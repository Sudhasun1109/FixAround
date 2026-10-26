const { Router } = require('express');
const customerController = require('../controllers/customer.controller');
const { verifyToken } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { ROLES } = require('../utils/constants');

const router = Router();

// Public or customer states endpoint
router.get('/states', customerController.getStates);

router.use(verifyToken, authorize(ROLES.CUSTOMER, ROLES.ADMIN));

// Support both /addresses and direct routing when mounted at /api/v1/addresses or /api/v1/customers
router.get(['/addresses', '/'], customerController.getAddresses);
router.post(['/addresses', '/'], customerController.createAddress);
router.put(['/addresses/:id', '/:id'], customerController.updateAddress);
router.patch(['/addresses/:id/default', '/:id/default'], customerController.setDefaultAddress);
router.delete(['/addresses/:id', '/:id'], customerController.deleteAddress);

// Customer Wallet & Topup
router.get('/wallet', customerController.getWallet);
router.post('/wallet/topup', customerController.topupWallet);
router.post('/wallet/razorpay/create-order', customerController.createWalletRazorpayOrder);
router.post('/wallet/razorpay/verify', customerController.verifyWalletRazorpay);

module.exports = router;
