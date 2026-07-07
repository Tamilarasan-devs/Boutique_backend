const pool = require('../config/db');

const createProductionTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS production (
      id SERIAL PRIMARY KEY,
      boutique_id INT NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
      order_id VARCHAR(50),
      customer_name VARCHAR(100) NOT NULL,
      garment VARCHAR(150) NOT NULL,
      tailor VARCHAR(100),
      stage VARCHAR(50) DEFAULT 'Cutting',
      priority VARCHAR(50) DEFAULT 'Medium',
      start_date DATE DEFAULT CURRENT_DATE,
      expected_end_date DATE,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(query);
    console.log('Production table verified/created');
  } catch (error) {
    console.error('Error creating production table:', error);
  }
};

module.exports = { createProductionTable };
