const express = require('express');
const router = express.Router();
const { getProduction, addProduction, updateProductionStage, deleteProduction } = require('../controller/productionController');

router.get('/', getProduction);
router.post('/', addProduction);
router.put('/:id/stage', updateProductionStage);
router.delete('/:id', deleteProduction);

module.exports = router;
