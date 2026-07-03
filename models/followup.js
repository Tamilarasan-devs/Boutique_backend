const pool = require('../config/db');

const createFollowupsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS followups (
      id SERIAL PRIMARY KEY,
      boutique_id INT NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
      customer_name VARCHAR(100) NOT NULL,
      channel VARCHAR(50) NOT NULL,
      reason TEXT NOT NULL,
      due_date DATE NOT NULL,
      status VARCHAR(50) DEFAULT 'Pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(query);
    console.log('Followups table verified/created');
  } catch (error) {
    console.error('Error creating followups table:', error);
  }
};

module.exports = {
  createFollowupsTable,
};
