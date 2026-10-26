const { Router } = require('express');
const customerController = require('../controllers/customer.controller');
const { verifyToken } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { ROLES } = require('../utils/constants');

const router = Router();

router.use(verifyToken, authorize(ROLES.CUSTOMER, ROLES.ADMIN));

// Support both /addresses and direct routing when mounted at /api/v1/addresses or /api/v1/customers
router.get(['/addresses', '/'], customerController.getAddresses);
router.post(['/addresses', '/'], customerController.createAddress);
router.put(['/addresses/:id', '/:id'], customerController.updateAddress);
router.patch(['/addresses/:id/default', '/:id/default'], customerController.setDefaultAddress);
router.delete(['/addresses/:id', '/:id'], customerController.deleteAddress);

// Customer Wallet
router.get('/wallet', customerController.getWallet);

module.exports = router;
