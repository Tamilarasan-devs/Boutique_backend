const express = require('express');
const router = express.Router();
const { getProducts, createProduct, updateProduct, deleteProduct } = require('../controller/productController');

// All routes are protected by verifyToken which is applied in server.js

// @route   GET /api/products
router.get('/', getProducts);

// @route   POST /api/products
router.post('/', createProduct);

// @route   PUT /api/products/:id
router.put('/:id', updateProduct);

// @route   DELETE /api/products/:id
router.delete('/:id', deleteProduct);

module.exports = router;
