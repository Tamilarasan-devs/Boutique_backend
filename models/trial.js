const pool = require('../config/db');

const createTrialsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS trials (
      id SERIAL PRIMARY KEY,
      boutique_id INT NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
      order_id VARCHAR(50),
      customer_name VARCHAR(100) NOT NULL,
      garment VARCHAR(150) NOT NULL,
      date DATE NOT NULL,
      time VARCHAR(20) NOT NULL,
      tailor VARCHAR(100),
      alteration_notes TEXT,
      status VARCHAR(50) DEFAULT 'Scheduled',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(query);
    console.log('Trials table verified/created');
  } catch (error) {
    console.error('Error creating trials table:', error);
  }
};

module.exports = { createTrialsTable };
