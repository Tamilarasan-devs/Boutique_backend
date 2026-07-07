const pool = require('../config/db');

const getOrders = async (req, res) => {
  const boutique_id = req.user.boutique_id;
  try {
    const result = await pool.query('SELECT * FROM orders WHERE boutique_id = $1 ORDER BY delivery_date ASC', [boutique_id]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const addOrder = async (req, res) => {
  const {
    customer_name, category, stitching_cost, total_amount, advance_paid,
    delivery_date, order_date, tailor, fabric_details, priority, status
  } = req.body;
  const boutique_id = req.user.boutique_id;

  if (!customer_name || !category || !delivery_date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO orders (
        boutique_id, customer_name, category, stitching_cost, total_amount, advance_paid,
        delivery_date, order_date, tailor, fabric_details, priority, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        boutique_id, customer_name, category, stitching_cost || 0, total_amount || 0, advance_paid || 0,
        delivery_date, order_date || new Date(), tailor || '', fabric_details || '',
        priority || 'Normal', status || 'Received'
      ]
    );
    
    res.status(201).json({
      message: 'Order added successfully',
      order: result.rows[0],
    });
  } catch (error) {
    console.error('Error adding order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const boutique_id = req.user.boutique_id;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  try {
    const result = await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2 AND boutique_id = $3 RETURNING *',
      [status, id, boutique_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.status(200).json({
      message: 'Order status updated successfully',
      order: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteOrder = async (req, res) => {
  const { id } = req.params;
  const boutique_id = req.user.boutique_id;

  try {
    const result = await pool.query('DELETE FROM orders WHERE id = $1 AND boutique_id = $2 RETURNING *', [id, boutique_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.status(200).json({
      message: 'Order deleted successfully',
      order: result.rows[0],
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const convertFromQuotation = async (req, res) => {
  const { id } = req.params; // quotation id
  const boutique_id = req.user.boutique_id;
  try {
    const quotResult = await pool.query('SELECT * FROM quotations WHERE id = $1 AND boutique_id = $2', [id, boutique_id]);
    if (quotResult.rows.length === 0) return res.status(404).json({ error: 'Quotation not found' });
    const q = quotResult.rows[0];

    // Mark quotation as Accepted
    await pool.query('UPDATE quotations SET status = $1 WHERE id = $2', ['Accepted', id]);

    // Create order from quotation data
    const result = await pool.query(
      `INSERT INTO orders (boutique_id, customer_name, category, total_amount, delivery_date, status)
       VALUES ($1, $2, $3, $4, CURRENT_DATE + INTERVAL '30 days', 'Received') RETURNING *`,
      [boutique_id, q.customer_name, q.items, q.total_amount]
    );
    res.status(201).json({ message: 'Order created from quotation', order: result.rows[0] });
  } catch (error) {
    console.error('Error converting quotation to order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getOrderById = async (req, res) => {
  const { id } = req.params;
  const boutique_id = req.user.boutique_id;
  try {
    const result = await pool.query('SELECT * FROM orders WHERE id = $1 AND boutique_id = $2', [id, boutique_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching order by id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateOrder = async (req, res) => {
  const { id } = req.params;
  const {
    customer_name, category, stitching_cost, total_amount, advance_paid,
    delivery_date, order_date, tailor, fabric_details, priority, status
  } = req.body;
  const boutique_id = req.user.boutique_id;

  if (!customer_name || !category || !delivery_date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await pool.query(
      `UPDATE orders SET 
         customer_name = $1, category = $2, stitching_cost = $3, total_amount = $4, advance_paid = $5,
         delivery_date = $6, order_date = $7, tailor = $8, fabric_details = $9, priority = $10, status = $11
       WHERE id = $12 AND boutique_id = $13 RETURNING *`,
      [
        customer_name, category, stitching_cost || 0, total_amount || 0, advance_paid || 0,
        delivery_date, order_date, tailor || '', fabric_details || '', priority || 'Normal', status || 'Received', id, boutique_id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.status(200).json({
      message: 'Order updated successfully',
      order: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getOrders,
  addOrder,
  updateOrderStatus,
  deleteOrder,
  convertFromQuotation,
  getOrderById,
  updateOrder,
};
