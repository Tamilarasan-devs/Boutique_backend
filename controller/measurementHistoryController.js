const pool = require('../config/db');

// Get all measurement history
exports.getAllHistory = async (req, res) => {
  const boutique_id = req.user.boutique_id;
  try {
    const result = await pool.query(`
      SELECT mh.*, c.name as customer_name, mt.name as template_name 
      FROM measurement_history mh
      LEFT JOIN customers c ON mh.customer_id = c.id
      LEFT JOIN measurement_templates mt ON mh.template_id = mt.id
      WHERE mh.boutique_id = $1
      ORDER BY mh.updated_at DESC
    `, [boutique_id]);
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get history by customer
exports.getHistoryByCustomer = async (req, res) => {
  const { customerId } = req.params;
  const boutique_id = req.user.boutique_id;
  try {
    const result = await pool.query(`
      SELECT mh.*, mt.name as template_name 
      FROM measurement_history mh
      LEFT JOIN measurement_templates mt ON mh.template_id = mt.id
      WHERE mh.customer_id = $1 AND mh.boutique_id = $2
      ORDER BY mh.updated_at DESC
    `, [customerId, boutique_id]);
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create new measurement history
exports.createHistory = async (req, res) => {
  const { customerId, templateId, measurements, notes } = req.body;
  const boutique_id = req.user.boutique_id;
  try {
    const result = await pool.query(
      'INSERT INTO measurement_history (boutique_id, customer_id, template_id, measurements, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [boutique_id, customerId, templateId, JSON.stringify(measurements), notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update measurement history
exports.updateHistory = async (req, res) => {
  const { id } = req.params;
  const { customerId, templateId, measurements, notes } = req.body;
  const boutique_id = req.user.boutique_id;
  try {
    const result = await pool.query(
      'UPDATE measurement_history SET customer_id = $1, template_id = $2, measurements = $3, notes = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 AND boutique_id = $6 RETURNING *',
      [customerId, templateId, JSON.stringify(measurements), notes, id, boutique_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'History not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete measurement history
exports.deleteHistory = async (req, res) => {
  const { id } = req.params;
  const boutique_id = req.user.boutique_id;
  try {
    const result = await pool.query('DELETE FROM measurement_history WHERE id = $1 AND boutique_id = $2 RETURNING *', [id, boutique_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'History not found' });
    }
    res.status(200).json({ message: 'History deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
