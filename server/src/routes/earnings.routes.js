const { Router } = require('express');
const earningsController = require('../controllers/earnings.controller');
const { verifyToken } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { ROLES } = require('../utils/constants');

const router = Router();

router.use(verifyToken, authorize(ROLES.TECHNICIAN));

router.get('/my-earnings/summary', earningsController.getSummary);
router.get('/my-earnings', earningsController.getMyEarnings);
router.get('/summary', earningsController.getSummary);
router.get('/', earningsController.getMyEarnings);

module.exports = router;
