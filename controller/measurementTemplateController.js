const pool = require('../config/db');

// Get all measurement templates
exports.getAllTemplates = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT mt.*, c.name as customer_name
      FROM measurement_templates mt
      LEFT JOIN customers c ON mt.customer_id = c.id
      ORDER BY mt.updated_at DESC
    `);
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create a new measurement template
exports.createTemplate = async (req, res) => {
  const { customerId, name, category, garmentType, fields } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO measurement_templates (customer_id, name, category, garment_type, fields) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [customerId || null, name, category, garmentType, JSON.stringify(fields)]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a measurement template
exports.updateTemplate = async (req, res) => {
  const { id } = req.params;
  const { customerId, name, category, garmentType, fields } = req.body;
  try {
    const result = await pool.query(
      'UPDATE measurement_templates SET customer_id = $1, name = $2, category = $3, garment_type = $4, fields = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
      [customerId || null, name, category, garmentType, JSON.stringify(fields), id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Template not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a measurement template
exports.deleteTemplate = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM measurement_templates WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Template not found' });
    }
    res.status(200).json({ message: 'Template deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
