const pool = require('../config/db');

const createPaymentsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY,
      boutique_id INT NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
      receipt_number VARCHAR(50) UNIQUE NOT NULL,
      invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
      customer_name VARCHAR(100) NOT NULL,
      amount NUMERIC(10, 2) NOT NULL,
      method VARCHAR(50) NOT NULL,
      payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
      note TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(query);
    console.log('Payments table verified/created');
  } catch (error) {
    console.error('Error creating payments table:', error);
  }
};

module.exports = { createPaymentsTable };
