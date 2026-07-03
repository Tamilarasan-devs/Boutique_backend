const pool = require('../config/db');

const createOrdersTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      boutique_id INT NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
      customer_name VARCHAR(100) NOT NULL,
      category VARCHAR(100) NOT NULL,
      stitching_cost NUMERIC(10, 2),
      total_amount NUMERIC(10, 2),
      advance_paid NUMERIC(10, 2),
      delivery_date DATE NOT NULL,
      order_date DATE DEFAULT CURRENT_DATE,
      tailor VARCHAR(100),
      fabric_details TEXT,
      priority VARCHAR(50) DEFAULT 'Normal',
      status VARCHAR(50) DEFAULT 'Received',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(query);
    console.log('Orders table verified/created');
  } catch (error) {
    console.error('Error creating orders table:', error);
  }
};

module.exports = {
  createOrdersTable,
};
