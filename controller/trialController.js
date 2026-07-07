const pool = require('../config/db');

const getTrials = async (req, res) => {
  const boutique_id = req.user.boutique_id;
  try {
    const result = await pool.query('SELECT * FROM trials WHERE boutique_id = $1 ORDER BY date DESC', [boutique_id]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching trials:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const addTrial = async (req, res) => {
  const { order_id, customer_name, garment, date, time, tailor, alteration_notes, status } = req.body;
  const boutique_id = req.user.boutique_id;

  if (!customer_name || !garment || !date || !time) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO trials (boutique_id, order_id, customer_name, garment, date, time, tailor, alteration_notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [boutique_id, order_id || '', customer_name, garment, date, time, tailor || '', alteration_notes || '', status || 'Scheduled']
    );
    res.status(201).json({ message: 'Trial scheduled', trial: result.rows[0] });
  } catch (error) {
    console.error('Error adding trial:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateTrialStatus = async (req, res) => {
  const { id } = req.params;
  const { status, alteration_notes } = req.body;
  const boutique_id = req.user.boutique_id;
  if (!status) return res.status(400).json({ error: 'Status is required' });

  try {
    let result;
    if (alteration_notes !== undefined) {
      result = await pool.query('UPDATE trials SET status = $1, alteration_notes = $2 WHERE id = $3 AND boutique_id = $4 RETURNING *', [status, alteration_notes, id, boutique_id]);
    } else {
      result = await pool.query('UPDATE trials SET status = $1 WHERE id = $2 AND boutique_id = $3 RETURNING *', [status, id, boutique_id]);
    }
    if (result.rows.length === 0) return res.status(404).json({ error: 'Trial not found' });
    res.status(200).json({ message: 'Trial status updated', trial: result.rows[0] });
  } catch (error) {
    console.error('Error updating trial status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteTrial = async (req, res) => {
  const { id } = req.params;
  const boutique_id = req.user.boutique_id;
  try {
    const result = await pool.query('DELETE FROM trials WHERE id = $1 AND boutique_id = $2 RETURNING *', [id, boutique_id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Trial not found' });
    res.status(200).json({ message: 'Trial deleted', trial: result.rows[0] });
  } catch (error) {
    console.error('Error deleting trial:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getTrials, addTrial, updateTrialStatus, deleteTrial };
