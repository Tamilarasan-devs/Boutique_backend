const express = require('express');
const router = express.Router();
const measurementHistoryController = require('../controller/measurementHistoryController');

router.get('/', measurementHistoryController.getAllHistory);
router.get('/customer/:customerId', measurementHistoryController.getHistoryByCustomer);
router.post('/', measurementHistoryController.createHistory);
router.put('/:id', measurementHistoryController.updateHistory);
router.delete('/:id', measurementHistoryController.deleteHistory);

module.exports = router;
