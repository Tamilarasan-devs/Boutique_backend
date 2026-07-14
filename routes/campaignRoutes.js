const express = require('express');
const router = express.Router();
const { getCampaigns, getCampaignAudiences, createCampaign, deleteCampaign } = require('../controller/campaignController');

// All routes are protected by verifyToken which is applied in server.js

// @route   GET /api/campaigns
router.get('/', getCampaigns);

// @route   GET /api/campaigns/audiences
router.get('/audiences', getCampaignAudiences);

// @route   POST /api/campaigns
router.post('/', createCampaign);

// @route   DELETE /api/campaigns/:id
router.delete('/:id', deleteCampaign);

module.exports = router;
