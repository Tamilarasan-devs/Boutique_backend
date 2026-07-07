const pool = require('../config/db');

const addCustomer = async (req, res) => {
  const { name, email, phone, address } = req.body;
  const boutique_id = req.user.boutique_id;

  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    // Check for duplicates
    let duplicateCheckQuery = 'SELECT id FROM customers WHERE boutique_id = $1 AND (';
    let queryParams = [boutique_id];
    let conditions = [];
    let idx = 2;

    if (phone && phone.trim() !== '') {
      conditions.push(`phone = $${idx}`);
      queryParams.push(phone.trim());
      idx++;
    }
    if (email && email.trim() !== '') {
      conditions.push(`email = $${idx}`);
      queryParams.push(email.trim());
    }

    if (conditions.length > 0) {
      duplicateCheckQuery += conditions.join(' OR ') + ')';
      const existing = await pool.query(duplicateCheckQuery, queryParams);
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'A customer with this phone number or email already exists.' });
      }
    }

    const result = await pool.query(
      'INSERT INTO customers (boutique_id, name, email, phone, address) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [boutique_id, name, email, phone, address]
    );
    
    res.status(201).json({
      message: 'Customer added successfully',
      customer: result.rows[0],
    });
  } catch (error) {
    console.error('Error adding customer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getCustomers = async (req, res) => {
  const { page, limit, search } = req.query;
  const boutique_id = req.user.boutique_id;
  
  let query = `
    SELECT c.*, 
           COALESCE(count(o.id), 0)::integer as orders_count,
           max(o.order_date) as last_order_date
    FROM customers c
    LEFT JOIN orders o ON o.customer_name = c.name AND o.boutique_id = c.boutique_id
    WHERE c.boutique_id = $1
  `;
  
  const queryParams = [boutique_id];
  if (search) {
    query += ` AND (c.name ILIKE $2 OR c.email ILIKE $2 OR c.phone ILIKE $2)`;
    queryParams.push(`%${search}%`);
  }
  
  query += ` GROUP BY c.id ORDER BY c.created_at DESC`;
  
  try {
    const result = await pool.query(query, queryParams);
    
    if (page && limit) {
      const p = parseInt(page, 10) || 1;
      const l = parseInt(limit, 10) || 10;
      const startIndex = (p - 1) * l;
      const endIndex = p * l;
      const paginated = result.rows.slice(startIndex, endIndex);
      
      return res.status(200).json({
        customers: paginated,
        meta: {
          page: p,
          limit: l,
          total: result.rows.length,
          totalPages: Math.ceil(result.rows.length / l)
        }
      });
    }
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getCustomerById = async (req, res) => {
  const { id } = req.params;
  const boutique_id = req.user.boutique_id;
  try {
    const result = await pool.query(
      `SELECT c.*, 
              COALESCE(count(o.id), 0)::integer as orders_count,
              max(o.order_date) as last_order_date
       FROM customers c
       LEFT JOIN orders o ON o.customer_name = c.name AND o.boutique_id = c.boutique_id
       WHERE c.id = $1 AND c.boutique_id = $2
       GROUP BY c.id`,
      [id, boutique_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching customer by id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateCustomer = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, address } = req.body;
  const boutique_id = req.user.boutique_id;
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  try {
    // Check for duplicates excluding current customer
    let duplicateCheckQuery = 'SELECT id FROM customers WHERE boutique_id = $1 AND id != $2 AND (';
    let queryParams = [boutique_id, id];
    let conditions = [];
    let idx = 3;

    if (phone && phone.trim() !== '') {
      conditions.push(`phone = $${idx}`);
      queryParams.push(phone.trim());
      idx++;
    }
    if (email && email.trim() !== '') {
      conditions.push(`email = $${idx}`);
      queryParams.push(email.trim());
    }

    if (conditions.length > 0) {
      duplicateCheckQuery += conditions.join(' OR ') + ')';
      const existing = await pool.query(duplicateCheckQuery, queryParams);
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'Another customer with this phone number or email already exists.' });
      }
    }

    const result = await pool.query(
      'UPDATE customers SET name=$1, email=$2, phone=$3, address=$4 WHERE id=$5 AND boutique_id=$6 RETURNING *',
      [name, email, phone, address, id, boutique_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.status(200).json({
      message: 'Customer updated successfully',
      customer: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteCustomer = async (req, res) => {
  const { id } = req.params;
  const boutique_id = req.user.boutique_id;
  try {
    const result = await pool.query('DELETE FROM customers WHERE id=$1 AND boutique_id=$2 RETURNING *', [id, boutique_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.status(200).json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  addCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer
};
