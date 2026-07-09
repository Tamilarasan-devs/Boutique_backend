const express = require('express');
const router = express.Router();
const {
  getSuppliers,
  addSupplier,
  updateSupplier,
  deleteSupplier,
  getItems,
  addItem,
  updateItem,
  deleteItem,
  getPurchases,
  addPurchase,
  updatePurchase,
  deletePurchase,
  updatePurchaseStatus,
  getStockLedger,
  addStockLedger
} = require('../controller/inventoryController');

// Suppliers
router.get('/suppliers', getSuppliers);
router.post('/suppliers', addSupplier);
router.put('/suppliers/:id', updateSupplier);
router.delete('/suppliers/:id', deleteSupplier);

// Inventory Items
router.get('/items', getItems);
router.post('/items', addItem);
router.put('/items/:id', updateItem);
router.delete('/items/:id', deleteItem);

// Purchases
router.get('/purchases', getPurchases);
router.post('/purchases', addPurchase);
router.put('/purchases/:id', updatePurchase);
router.delete('/purchases/:id', deletePurchase);
router.put('/purchases/:id/status', updatePurchaseStatus);

// Stock Ledger
router.get('/stock-ledger', getStockLedger);
router.post('/stock-ledger', addStockLedger);

module.exports = router;
