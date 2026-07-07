const pool = require('../config/db');

const createQuotationsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS quotations (
      id SERIAL PRIMARY KEY,
      boutique_id INT NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
      customer_name VARCHAR(100) NOT NULL,
      items TEXT NOT NULL,
      total_amount NUMERIC(10, 2) NOT NULL,
      discount NUMERIC(5, 2) DEFAULT 0,
      date DATE DEFAULT CURRENT_DATE,
      valid_until DATE NOT NULL,
      terms TEXT,
      status VARCHAR(50) DEFAULT 'Draft',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(query);
    console.log('Quotations table verified/created');
  } catch (error) {
    console.error('Error creating quotations table:', error);
  }
};

module.exports = { createQuotationsTable };
