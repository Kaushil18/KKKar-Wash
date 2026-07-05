const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile } = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { validate, userValidation } = require('../middleware/validation');

router.post('/register', validate(userValidation.register), register);
router.post('/login', validate(userValidation.login), login);
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);

module.exports = router;