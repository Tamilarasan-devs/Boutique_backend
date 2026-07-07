const pool = require('../config/db');

const getQuotations = async (req, res) => {
  const boutique_id = req.user.boutique_id;
  try {
    const result = await pool.query('SELECT * FROM quotations WHERE boutique_id = $1 ORDER BY created_at DESC', [boutique_id]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching quotations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const addQuotation = async (req, res) => {
  const { customer_name, items, total_amount, discount, date, valid_until, terms, status } = req.body;
  const boutique_id = req.user.boutique_id;

  if (!customer_name || !items || !total_amount || !valid_until) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO quotations (boutique_id, customer_name, items, total_amount, discount, date, valid_until, terms, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [boutique_id, customer_name, items, total_amount, discount || 0, date || new Date(), valid_until, terms || '', status || 'Draft']
    );
    res.status(201).json({ message: 'Quotation created', quotation: result.rows[0] });
  } catch (error) {
    console.error('Error adding quotation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateQuotationStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const boutique_id = req.user.boutique_id;
  if (!status) return res.status(400).json({ error: 'Status is required' });

  try {
    const result = await pool.query('UPDATE quotations SET status = $1 WHERE id = $2 AND boutique_id = $3 RETURNING *', [status, id, boutique_id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Quotation not found' });
    res.status(200).json({ message: 'Quotation status updated', quotation: result.rows[0] });
  } catch (error) {
    console.error('Error updating quotation status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteQuotation = async (req, res) => {
  const { id } = req.params;
  const boutique_id = req.user.boutique_id;
  try {
    const result = await pool.query('DELETE FROM quotations WHERE id = $1 AND boutique_id = $2 RETURNING *', [id, boutique_id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Quotation not found' });
    res.status(200).json({ message: 'Quotation deleted', quotation: result.rows[0] });
  } catch (error) {
    console.error('Error deleting quotation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getQuotations, addQuotation, updateQuotationStatus, deleteQuotation };
