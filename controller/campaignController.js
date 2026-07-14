const pool = require('../config/db');

// @desc    Get all marketing campaigns for a boutique
// @route   GET /api/campaigns
// @access  Private
const getCampaigns = async (req, res) => {
  const boutique_id = req.user.boutique_id;

  try {
    const result = await pool.query(
      `SELECT * FROM marketing_campaigns 
       WHERE boutique_id = $1 
       ORDER BY created_at DESC`,
      [boutique_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching campaigns:', err.message);
    res.status(500).json({ error: 'Server error fetching campaigns' });
  }
};

// @desc    Get audience email lists
// @route   GET /api/campaigns/audiences
// @access  Private
const getCampaignAudiences = async (req, res) => {
  const boutique_id = req.user.boutique_id;

  try {
    // 1. Fetch from customers
    const customersRes = await pool.query(
      `SELECT DISTINCT email FROM customers 
       WHERE boutique_id = $1 AND email IS NOT NULL AND email LIKE '%@%'`,
      [boutique_id]
    );
    const customerEmails = customersRes.rows.map(r => r.email);

    // 2. Fetch from leads (where phone field contains an email)
    const leadsRes = await pool.query(
      `SELECT DISTINCT phone as email FROM leads 
       WHERE boutique_id = $1 AND phone IS NOT NULL AND phone LIKE '%@%'`,
      [boutique_id]
    );
    const leadEmails = leadsRes.rows.map(r => r.email);

    // 3. Fetch from followups (join with customers to get email)
    const followupsRes = await pool.query(
      `SELECT DISTINCT c.email 
       FROM followups f 
       JOIN customers c ON f.customer_name = c.name AND f.boutique_id = c.boutique_id
       WHERE f.boutique_id = $1 AND c.email IS NOT NULL AND c.email LIKE '%@%'`,
      [boutique_id]
    );
    const followupEmails = followupsRes.rows.map(r => r.email);

    res.json({
      customers: customerEmails,
      leads: leadEmails,
      followups: followupEmails
    });
  } catch (err) {
    console.error('Error fetching audiences:', err.message);
    res.status(500).json({ error: 'Server error fetching audiences' });
  }
};

// @desc    Create a new marketing campaign
// @route   POST /api/campaigns
// @access  Private
const createCampaign = async (req, res) => {
  const boutique_id = req.user.boutique_id;
  const { name, channel, audience_count, status, subject, body } = req.body;

  if (!name || !subject || !body) {
    return res.status(400).json({ error: 'Name, subject, and body are required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO marketing_campaigns 
        (boutique_id, name, channel, audience_count, status, subject, body, sent_at)
       VALUES 
        ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING *`,
      [
        boutique_id, 
        name, 
        channel || 'Email', 
        audience_count || 0, 
        status || 'Completed', // Defaulting to completed since we mock the send
        subject, 
        body
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating campaign:', err.message);
    res.status(500).json({ error: 'Server error creating campaign' });
  }
};

// @desc    Delete a marketing campaign
// @route   DELETE /api/campaigns/:id
// @access  Private
const deleteCampaign = async (req, res) => {
  const { id } = req.params;
  const boutique_id = req.user.boutique_id;

  try {
    const result = await pool.query(
      `DELETE FROM marketing_campaigns 
       WHERE id = $1 AND boutique_id = $2 
       RETURNING id`,
      [id, boutique_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json({ message: 'Campaign deleted successfully' });
  } catch (err) {
    console.error('Error deleting campaign:', err.message);
    res.status(500).json({ error: 'Server error deleting campaign' });
  }
};

module.exports = {
  getCampaigns,
  getCampaignAudiences,
  createCampaign,
  deleteCampaign
};
