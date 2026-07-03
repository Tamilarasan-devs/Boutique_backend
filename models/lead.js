const pool = require('../config/db');

const createLeadsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS leads (
      id SERIAL PRIMARY KEY,
      boutique_id INT NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
      lead_id VARCHAR(50) UNIQUE,
      name VARCHAR(100) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      source VARCHAR(50),
      requirement TEXT,
      status VARCHAR(20) DEFAULT 'New',
      value VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(query);
    console.log('Leads table verified/created');
  } catch (error) {
    console.error('Error creating leads table:', error);
  }
};

module.exports = { createLeadsTable };
