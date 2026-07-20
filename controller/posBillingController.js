const pool = require('../config/db');
const { generateDisplayId } = require('../utils/sequenceGenerator');

const getPosBills = async (req, res) => {
  const boutique_id = req.user.boutique_id;
  try {
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const countRes = await pool.query(`SELECT COUNT(*) FROM pos_bills WHERE boutique_id = $1`, [boutique_id]);
    const total = parseInt(countRes.rows[0].count);

    const result = await pool.query(
      `SELECT * FROM pos_bills WHERE boutique_id = $1 ORDER BY bill_date DESC, id DESC LIMIT $2 OFFSET $3`,
      [boutique_id, limit, offset]
    );

    res.status(200).json({
      data: result.rows,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Error fetching POS bills:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createPosBill = async (req, res) => {
  const boutique_id = req.user.boutique_id;
  const { customer_name, customer_phone, bill_date, total_amount, items, status } = req.body;

  try {
    const bill_number = await generateDisplayId(boutique_id, 'pos_bill', 'BILL');
    const itemsStr = typeof items === 'string' ? items : JSON.stringify(items);

    const result = await pool.query(
      `INSERT INTO pos_bills (
        boutique_id, bill_number, customer_name, customer_phone, bill_date, total_amount, status, items
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        boutique_id,
        bill_number,
        customer_name,
        customer_phone || null,
        bill_date || new Date(),
        total_amount,
        status || 'Paid',
        itemsStr
      ]
    );

    res.status(201).json({ message: 'POS bill created successfully', bill: result.rows[0] });
  } catch (error) {
    console.error('Error creating POS bill:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

module.exports = {
  getPosBills,
  createPosBill
};
