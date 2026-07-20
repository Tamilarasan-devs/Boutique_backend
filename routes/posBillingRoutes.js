const express = require('express');
const router = express.Router();
const { getPosBills, createPosBill } = require('../controller/posBillingController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken); // Secure all POS billing routes

router.get('/bills', getPosBills);
router.post('/bills', createPosBill);

module.exports = router;
