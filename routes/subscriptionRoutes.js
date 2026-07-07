const express = require('express');
const router = express.Router();
const { createSubscription, verifySignature, getSubscriptionStatus } = require('../controller/subscriptionController');

router.post('/create', createSubscription);
router.post('/verify-signature', verifySignature);
router.get('/status', getSubscriptionStatus);

module.exports = router;
