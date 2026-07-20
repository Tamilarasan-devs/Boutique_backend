const pool = require('../config/db');

// --- Suppliers ---
const getSuppliers = async (req, res) => {
  const boutique_id = req.user.boutique_id;
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const countRes = await pool.query(`SELECT COUNT(*) FROM suppliers WHERE boutique_id = $1`, [boutique_id]);
    const total = parseInt(countRes.rows[0].count);

    const result = await pool.query(
      `SELECT * FROM suppliers WHERE boutique_id = $1 ORDER BY id DESC LIMIT $2 OFFSET $3`,
      [boutique_id, limit, offset]
    );

    res.status(200).json({
      data: result.rows,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const addSupplier = async (req, res) => {
  const { name, contact, email, phone, location, category, rating } = req.body;
  const boutique_id = req.user.boutique_id;
  if (!name || !phone) return res.status(400).json({ error: 'Name and Phone are required' });

  try {
    const result = await pool.query(
      `INSERT INTO suppliers (boutique_id, name, contact, email, phone, location, category, rating)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [boutique_id, name, contact || '', email || '', phone, location || '', category || '', rating || 5]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding supplier:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateSupplier = async (req, res) => {
  const { id } = req.params;
  const { name, contact, email, phone, location, category, rating } = req.body;
  const boutique_id = req.user.boutique_id;
  try {
    const result = await pool.query(
      `UPDATE suppliers SET name=$1, contact=$2, email=$3, phone=$4, location=$5, category=$6, rating=$7
       WHERE id=$8 AND boutique_id=$9 RETURNING *`,
      [name, contact, email, phone, location, category, rating, id, boutique_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Supplier not found' });
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteSupplier = async (req, res) => {
  const { id } = req.params;
  const boutique_id = req.user.boutique_id;
  try {
    const result = await pool.query('DELETE FROM suppliers WHERE id = $1 AND boutique_id = $2 RETURNING *', [id, boutique_id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Supplier not found' });
    res.status(200).json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// --- Inventory Items (Fabrics & Accessories) ---
const getItems = async (req, res) => {
  const boutique_id = req.user.boutique_id;
  const type = req.query.type;
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    let countQuery = `SELECT COUNT(*) FROM inventory_items WHERE boutique_id = $1`;
    let query = `SELECT * FROM inventory_items WHERE boutique_id = $1`;
    const params = [boutique_id];

    if (type) {
      params.push(type);
      countQuery += ` AND type = $${params.length}`;
      query += ` AND type = $${params.length}`;
    }

    const countRes = await pool.query(countQuery, params);
    const total = parseInt(countRes.rows[0].count);

    query += ` ORDER BY id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const result = await pool.query(query, [...params, limit, offset]);

    res.status(200).json({
      data: result.rows,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const addItem = async (req, res) => {
  const { code, name, type, color, stock, min_stock, price, unit } = req.body;
  const boutique_id = req.user.boutique_id;
  if (!code || !name || !type) return res.status(400).json({ error: 'Code, Name and Type are required' });

  try {
    const result = await pool.query(
      `INSERT INTO inventory_items (boutique_id, code, name, type, color, stock, min_stock, price, unit)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [boutique_id, code, name, type, color || '', stock || 0, min_stock || 10, price || 0, unit || 'meters']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding inventory item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateItem = async (req, res) => {
  const { id } = req.params;
  const { code, name, type, color, stock, min_stock, price, unit } = req.body;
  const boutique_id = req.user.boutique_id;
  try {
    const result = await pool.query(
      `UPDATE inventory_items SET code=$1, name=$2, type=$3, color=$4, stock=$5, min_stock=$6, price=$7, unit=$8
       WHERE id=$9 AND boutique_id=$10 RETURNING *`,
      [code, name, type, color, stock, min_stock, price, unit, id, boutique_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteItem = async (req, res) => {
  const { id } = req.params;
  const boutique_id = req.user.boutique_id;
  try {
    const result = await pool.query('DELETE FROM inventory_items WHERE id = $1 AND boutique_id = $2 RETURNING *', [id, boutique_id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
    res.status(200).json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// --- Purchases (Purchase Orders) ---
const getPurchases = async (req, res) => {
  const boutique_id = req.user.boutique_id;
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const countRes = await pool.query(`SELECT COUNT(*) FROM purchases WHERE boutique_id = $1`, [boutique_id]);
    const total = parseInt(countRes.rows[0].count);

    const result = await pool.query(
      `SELECT * FROM purchases WHERE boutique_id = $1 ORDER BY id DESC LIMIT $2 OFFSET $3`,
      [boutique_id, limit, offset]
    );

    res.status(200).json({
      data: result.rows,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Error fetching purchases:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const addPurchase = async (req, res) => {
  const { po_number, supplier, items, total_amount, status } = req.body;
  const boutique_id = req.user.boutique_id;
  if (!po_number || !supplier || !items) return res.status(400).json({ error: 'po_number, supplier, and items are required' });

  try {
    const result = await pool.query(
      `INSERT INTO purchases (boutique_id, po_number, supplier, items, total_amount, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [boutique_id, po_number, supplier, items, total_amount || 0, status || 'Ordered']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding purchase:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updatePurchase = async (req, res) => {
  const { id } = req.params;
  const { po_number, supplier, items, total_amount, status } = req.body;
  const boutique_id = req.user.boutique_id;
  try {
    const result = await pool.query(
      `UPDATE purchases SET po_number=$1, supplier=$2, items=$3, total_amount=$4, status=$5
       WHERE id=$6 AND boutique_id=$7 RETURNING *`,
      [po_number, supplier, items, total_amount, status, id, boutique_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Purchase not found' });
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error updating purchase:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deletePurchase = async (req, res) => {
  const { id } = req.params;
  const boutique_id = req.user.boutique_id;
  try {
    const result = await pool.query('DELETE FROM purchases WHERE id = $1 AND boutique_id = $2 RETURNING *', [id, boutique_id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Purchase not found' });
    res.status(200).json({ message: 'Purchase deleted successfully' });
  } catch (error) {
    console.error('Error deleting purchase:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updatePurchaseStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const boutique_id = req.user.boutique_id;
  try {
    const result = await pool.query(
      `UPDATE purchases SET status = $1 WHERE id = $2 AND boutique_id = $3 RETURNING *`,
      [status, id, boutique_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Purchase not found' });
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error updating purchase status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// --- Stock Ledger ---
const getStockLedger = async (req, res) => {
  const boutique_id = req.user.boutique_id;
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const countRes = await pool.query(`SELECT COUNT(*) FROM stock_ledger WHERE boutique_id = $1`, [boutique_id]);
    const total = parseInt(countRes.rows[0].count);

    const result = await pool.query(
      `SELECT * FROM stock_ledger WHERE boutique_id = $1 ORDER BY id DESC LIMIT $2 OFFSET $3`,
      [boutique_id, limit, offset]
    );

    res.status(200).json({
      data: result.rows,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Error fetching stock ledger:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const addStockLedger = async (req, res) => {
  const { item_name, item_code, type, quantity, unit, reason, updated_by } = req.body;
  const boutique_id = req.user.boutique_id;
  if (!item_name || !item_code || !type || !quantity || !unit) {
    return res.status(400).json({ error: 'Missing required ledger fields' });
  }

  try {
    await pool.query('BEGIN');

    const ledgerResult = await pool.query(
      `INSERT INTO stock_ledger (boutique_id, item_name, item_code, type, quantity, unit, reason, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [boutique_id, item_name, item_code, type, quantity, unit, reason || '', updated_by || 'Admin']
    );

    const modifier = type === 'Stock In' ? quantity : -quantity;
    await pool.query(
      `UPDATE inventory_items SET stock = stock + $1 WHERE code = $2 AND boutique_id = $3`,
      [modifier, item_code, boutique_id]
    );

    await pool.query('COMMIT');
    res.status(201).json(ledgerResult.rows[0]);
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error adding stock ledger:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getSuppliers,
  addSupplier,
  updateSupplier,
  deleteSupplier,
  getItems,
  addItem,
  updateItem,
  deleteItem,
  getPurchases,
  addPurchase,
  updatePurchase,
  deletePurchase,
  updatePurchaseStatus,
  getStockLedger,
  addStockLedger
};
