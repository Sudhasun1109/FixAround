const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { registerValidation, loginValidation } = require('../validators/auth.validator');
const { authLimiter } = require('../middleware/rateLimiter');

const router = Router();

router.post('/register', authLimiter, validate(registerValidation), authController.register);
router.post('/login', authLimiter, validate(loginValidation), authController.login);
router.get('/me', verifyToken, authController.getMe);
router.patch('/profile', verifyToken, authController.updateProfile);
router.post('/logout', verifyToken, authController.logout);

module.exports = router;
