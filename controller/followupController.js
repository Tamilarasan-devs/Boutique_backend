const pool = require('../config/db');

const getFollowups = async (req, res) => {
  const boutique_id = req.user.boutique_id;
  try {
    const result = await pool.query('SELECT * FROM followups WHERE boutique_id = $1 ORDER BY due_date ASC', [boutique_id]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching followups:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const addFollowup = async (req, res) => {
  const { customer_name, channel, reason, due_date, status } = req.body;
  const boutique_id = req.user.boutique_id;

  if (!customer_name || !channel || !reason || !due_date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO followups (boutique_id, customer_name, channel, reason, due_date, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [boutique_id, customer_name, channel, reason, due_date, status || 'Pending']
    );
    
    res.status(201).json({
      message: 'Followup added successfully',
      followup: result.rows[0],
    });
  } catch (error) {
    console.error('Error adding followup:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateFollowupStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const boutique_id = req.user.boutique_id;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  try {
    const result = await pool.query(
      'UPDATE followups SET status = $1 WHERE id = $2 AND boutique_id = $3 RETURNING *',
      [status, id, boutique_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Followup not found' });
    }

    res.status(200).json({
      message: 'Followup status updated successfully',
      followup: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating followup status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getFollowups,
  addFollowup,
  updateFollowupStatus,
};
