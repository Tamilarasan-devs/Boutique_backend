const pool = require('../config/db');
const { generateDisplayId } = require('../utils/sequenceGenerator');

// Helper to get or create customer by name
const getOrCreateCustomer = async (customer_name, boutique_id) => {
  let customerRes = await pool.query('SELECT * FROM customers WHERE name = $1 AND boutique_id = $2', [customer_name, boutique_id]);
  if (customerRes.rows.length === 0) {
    customerRes = await pool.query(
      'INSERT INTO customers (boutique_id, name) VALUES ($1, $2) RETURNING *',
      [boutique_id, customer_name]
    );
  }
  return customerRes.rows[0];
};

// Helper to calculate loyalty points based on settings
const processLoyaltyPoints = async (boutique_id, customer_name, total_amount, status, existing_points_earned = 0) => {
  if (status !== 'Delivered') return 0; // Only award points when delivered
  if (existing_points_earned > 0) return 0; // Already awarded points

  const settingsRes = await pool.query('SELECT loyalty_enabled, points_per_unit FROM boutique_settings WHERE boutique_id = $1', [boutique_id]);
  if (settingsRes.rows.length > 0 && settingsRes.rows[0].loyalty_enabled) {
    const points_per_unit = settingsRes.rows[0].points_per_unit || 100;
    const points_earned = Math.floor((total_amount || 0) / points_per_unit);
    
    if (points_earned > 0) {
      const customer = await getOrCreateCustomer(customer_name, boutique_id);
      await pool.query('UPDATE customers SET loyalty_points = loyalty_points + $1 WHERE id = $2', [points_earned, customer.id]);
      return points_earned;
    }
  }
  return 0;
};


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
    delivery_date, order_date, tailor, fabric_details, priority, status,
    points_redeemed
  } = req.body;
  const boutique_id = req.user.boutique_id;

  if (!customer_name || !category || !delivery_date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    let final_total = total_amount || 0;
    let loyalty_discount = 0;
    let redeemed = points_redeemed || 0;
    
    if (redeemed > 0) {
      const settingsRes = await pool.query('SELECT loyalty_enabled, redemption_value FROM boutique_settings WHERE boutique_id = $1', [boutique_id]);
      const customerRes = await pool.query('SELECT id, loyalty_points FROM customers WHERE name = $1 AND boutique_id = $2', [customer_name, boutique_id]);
      
      if (settingsRes.rows.length > 0 && settingsRes.rows[0].loyalty_enabled && customerRes.rows.length > 0) {
        const customer = customerRes.rows[0];
        if (customer.loyalty_points >= redeemed) {
          loyalty_discount = redeemed * (settingsRes.rows[0].redemption_value || 1);
          final_total = Math.max(0, final_total - loyalty_discount);
          await pool.query('UPDATE customers SET loyalty_points = loyalty_points - $1 WHERE id = $2', [redeemed, customer.id]);
        } else {
          redeemed = 0; // Not enough points
        }
      } else {
        redeemed = 0;
      }
    }

    const points_earned = await processLoyaltyPoints(boutique_id, customer_name, final_total, status || 'Received');

    const display_id = await generateDisplayId(boutique_id, 'order', 'ORD');

    const result = await pool.query(
      `INSERT INTO orders (
        boutique_id, customer_name, category, stitching_cost, total_amount, advance_paid,
        delivery_date, order_date, tailor, fabric_details, priority, status,
        loyalty_discount, points_redeemed, points_earned, display_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
      [
        boutique_id, customer_name, category, stitching_cost || 0, final_total, advance_paid || 0,
        delivery_date, order_date || new Date(), tailor || '', fabric_details || '',
        priority || 'Normal', status || 'Received',
        loyalty_discount, redeemed, points_earned, display_id
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
    // Get existing order to check total_amount and points_earned
    const existingRes = await pool.query('SELECT * FROM orders WHERE id = $1 AND boutique_id = $2', [id, boutique_id]);
    if (existingRes.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    const order = existingRes.rows[0];

    let points_earned = order.points_earned || 0;
    const new_points_earned = await processLoyaltyPoints(boutique_id, order.customer_name, order.total_amount, status, points_earned);
    
    points_earned = points_earned + new_points_earned;

    const result = await pool.query(
      'UPDATE orders SET status = $1, points_earned = $2 WHERE id = $3 AND boutique_id = $4 RETURNING *',
      [status, points_earned, id, boutique_id]
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
  const { advance_amount } = req.body || {};
  const advanceAmount = parseFloat(advance_amount) || 0;
  const boutique_id = req.user.boutique_id;
  try {
    const quotResult = await pool.query('SELECT * FROM quotations WHERE id = $1 AND boutique_id = $2', [id, boutique_id]);
    if (quotResult.rows.length === 0) return res.status(404).json({ error: 'Quotation not found' });
    const q = quotResult.rows[0];

    // Mark quotation as Accepted
    await pool.query('UPDATE quotations SET status = $1 WHERE id = $2', ['Accepted', id]);

    const display_id = await generateDisplayId(boutique_id, 'order', 'ORD');

    // Create order from quotation data
    const result = await pool.query(
      `INSERT INTO orders (boutique_id, customer_name, category, total_amount, advance_paid, delivery_date, status, display_id)
       VALUES ($1, $2, $3, $4, $5, CURRENT_DATE + INTERVAL '30 days', 'Received', $6) RETURNING *`,
      [boutique_id, q.customer_name, q.items, q.total_amount, advanceAmount, display_id]
    );
    const newOrder = result.rows[0];

    // Generate Invoice
    const year = new Date().getFullYear();
    const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
    const invoice_number = `INV-${year}-B${boutique_id}-${uniqueSuffix}`;
    const invoiceStatus = advanceAmount >= parseFloat(q.total_amount) ? 'Paid' : 'Pending';

    // Parse items to JSON for invoice
    const itemsStr = JSON.stringify([{ description: q.items, quantity: 1, price: parseFloat(q.total_amount) }]);

    const invResult = await pool.query(
      `INSERT INTO invoices (
        boutique_id, invoice_number, order_id, quotation_id, customer_name, invoice_date, due_date, total_amount, status, items
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', $6, $7, $8) RETURNING *`,
      [boutique_id, invoice_number, newOrder.id, id, q.customer_name, q.total_amount, invoiceStatus, itemsStr]
    );
    const newInvoice = invResult.rows[0];

    // If advance amount, create a payment
    if (advanceAmount > 0) {
      const receipt_number = `PAY-B${boutique_id}-${Math.floor(1000 + Math.random() * 9000)}`;
      await pool.query(
        `INSERT INTO payments (
          boutique_id, receipt_number, invoice_id, customer_name, amount, method, payment_date, note
        ) VALUES ($1, $2, $3, $4, $5, 'Cash', CURRENT_DATE, 'Advance Payment')`,
        [boutique_id, receipt_number, newInvoice.id, q.customer_name, advanceAmount]
      );
    }

    res.status(201).json({ message: 'Order created from quotation', order: newOrder });
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
    const existingRes = await pool.query('SELECT * FROM orders WHERE id = $1 AND boutique_id = $2', [id, boutique_id]);
    if (existingRes.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    const order = existingRes.rows[0];

    // Assuming we do not recalculate discounts on update right now, but we check if delivered
    let points_earned = order.points_earned || 0;
    const new_points_earned = await processLoyaltyPoints(boutique_id, customer_name, total_amount || order.total_amount, status || order.status, points_earned);
    points_earned += new_points_earned;

    const result = await pool.query(
      `UPDATE orders SET 
         customer_name = $1, category = $2, stitching_cost = $3, total_amount = $4, advance_paid = $5,
         delivery_date = $6, order_date = $7, tailor = $8, fabric_details = $9, priority = $10, status = $11, points_earned = $12
       WHERE id = $13 AND boutique_id = $14 RETURNING *`,
      [
        customer_name, category, stitching_cost || 0, total_amount || 0, advance_paid || 0,
        delivery_date, order_date, tailor || '', fabric_details || '', priority || 'Normal', status || 'Received', points_earned, id, boutique_id
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
