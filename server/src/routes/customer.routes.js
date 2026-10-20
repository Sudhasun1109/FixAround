const { Router } = require('express');
const customerController = require('../controllers/customer.controller');
const { verifyToken } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { ROLES } = require('../utils/constants');

const router = Router();

router.use(verifyToken, authorize(ROLES.CUSTOMER, ROLES.ADMIN));

router.get('/addresses', customerController.getAddresses);
router.post('/addresses', customerController.createAddress);
router.put('/addresses/:id', customerController.updateAddress);
router.patch('/addresses/:id/default', customerController.setDefaultAddress);
router.delete('/addresses/:id', customerController.deleteAddress);

// Customer Wallet
router.get('/wallet', customerController.getWallet);

module.exports = router;
