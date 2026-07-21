const express = require('express');
const router = express.Router();
const { 
  getOrders, 
  addOrder, 
  updateOrderStatus, 
  deleteOrder, 
  convertFromQuotation,
  getOrderById,
  updateOrder,
  trackOrderByCommonId
} = require('../controller/orderController');

// @route   GET /api/orders
router.get('/', getOrders);

// @route   POST /api/orders
router.post('/', addOrder);

// @route   GET /api/orders/track/:common_id
router.get('/track/:common_id', trackOrderByCommonId);

// @route   GET /api/orders/:id
router.get('/:id', getOrderById);

// @route   PUT /api/orders/:id
router.put('/:id', updateOrder);

// @route   POST /api/orders/from-quotation/:id
router.post('/from-quotation/:id', convertFromQuotation);

// @route   PUT /api/orders/:id/status
router.put('/:id/status', updateOrderStatus);

// @route   DELETE /api/orders/:id
router.delete('/:id', deleteOrder);

module.exports = router;
