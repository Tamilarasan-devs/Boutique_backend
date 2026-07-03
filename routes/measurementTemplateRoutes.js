const express = require('express');
const router = express.Router();
const measurementTemplateController = require('../controller/measurementTemplateController');

router.get('/', measurementTemplateController.getAllTemplates);
router.post('/', measurementTemplateController.createTemplate);
router.put('/:id', measurementTemplateController.updateTemplate);
router.delete('/:id', measurementTemplateController.deleteTemplate);

module.exports = router;
