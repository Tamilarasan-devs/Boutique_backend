const pool = require('../config/db');

// @route   GET /api/leads
const getLeads = async (req, res) => {
  const boutique_id = req.user.boutique_id;
  try {
    const result = await pool.query('SELECT * FROM leads WHERE boutique_id = $1 ORDER BY created_at DESC', [boutique_id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @route   POST /api/leads
const addLead = async (req, res) => {
  const { lead_id, name, phone, source, requirement, status, value } = req.body;
  const boutique_id = req.user.boutique_id;
  try {
    const result = await pool.query(
      'INSERT INTO leads (boutique_id, lead_id, name, phone, source, requirement, status, value) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [boutique_id, lead_id, name, phone, source, requirement, status, value]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @route   PUT /api/leads/:id
const updateLeadStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const boutique_id = req.user.boutique_id;
  try {
    const result = await pool.query(
      'UPDATE leads SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND boutique_id = $3 RETURNING *',
      [status, id, boutique_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Lead not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @route   DELETE /api/leads/:id
const deleteLead = async (req, res) => {
  const { id } = req.params;
  const boutique_id = req.user.boutique_id;
  try {
    const result = await pool.query('DELETE FROM leads WHERE id = $1 AND boutique_id = $2 RETURNING *', [id, boutique_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Lead not found' });
    }
    res.json({ msg: 'Lead deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

module.exports = {
  getLeads,
  addLead,
  updateLeadStatus,
  deleteLead
};
