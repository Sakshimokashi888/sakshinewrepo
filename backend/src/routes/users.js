const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { getMe, getAllUsers } = require('../controllers/userController');

const router = express.Router();

router.use(authenticate);

router.get('/me', getMe);
router.get('/', requireAdmin, getAllUsers);

module.exports = router;
