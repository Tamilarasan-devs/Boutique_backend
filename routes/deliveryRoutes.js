const express = require('express');
const router = express.Router();
const { getDeliveries, addDelivery, updateDeliveryStatus, deleteDelivery } = require('../controller/deliveryController');

router.get('/', getDeliveries);
router.post('/', addDelivery);
router.put('/:id/status', updateDeliveryStatus);
router.delete('/:id', deleteDelivery);

module.exports = router;
