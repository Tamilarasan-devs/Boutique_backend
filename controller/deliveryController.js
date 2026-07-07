const pool = require('../config/db');

const getDeliveries = async (req, res) => {
  const boutique_id = req.user.boutique_id;
  try {
    const result = await pool.query('SELECT * FROM deliveries WHERE boutique_id = $1 ORDER BY created_at DESC', [boutique_id]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching deliveries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const addDelivery = async (req, res) => {
  const { order_id, customer_name, phone, garment, ready_date, delivery_method, tracking_number, status } = req.body;
  const boutique_id = req.user.boutique_id;

  if (!customer_name || !garment || !ready_date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO deliveries (boutique_id, order_id, customer_name, phone, garment, ready_date, delivery_method, tracking_number, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [boutique_id, order_id || '', customer_name, phone || '', garment, ready_date, delivery_method || 'Pickup', tracking_number || '', status || 'Ready for Pickup']
    );
    res.status(201).json({ message: 'Delivery added', delivery: result.rows[0] });
  } catch (error) {
    console.error('Error adding delivery:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateDeliveryStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const boutique_id = req.user.boutique_id;
  if (!status) return res.status(400).json({ error: 'Status is required' });

  try {
    let query = 'UPDATE deliveries SET status = $1';
    const params = [status];
    
    // Auto-set delivery_date when marked as Delivered
    if (status === 'Delivered') {
      query += ', delivery_date = CURRENT_DATE';
    }
    
    query += ` WHERE id = $${params.length + 1} AND boutique_id = $${params.length + 2} RETURNING *`;
    params.push(id, boutique_id);

    const result = await pool.query(query, params);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Delivery not found' });
    res.status(200).json({ message: 'Delivery status updated', delivery: result.rows[0] });
  } catch (error) {
    console.error('Error updating delivery status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteDelivery = async (req, res) => {
  const { id } = req.params;
  const boutique_id = req.user.boutique_id;
  try {
    const result = await pool.query('DELETE FROM deliveries WHERE id = $1 AND boutique_id = $2 RETURNING *', [id, boutique_id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Delivery not found' });
    res.status(200).json({ message: 'Delivery deleted', delivery: result.rows[0] });
  } catch (error) {
    console.error('Error deleting delivery:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getDeliveries, addDelivery, updateDeliveryStatus, deleteDelivery };
