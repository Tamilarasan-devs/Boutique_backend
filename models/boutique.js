const pool = require('../config/db');

const createBoutiquesTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS boutiques (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✓ boutiques table ready');
};

module.exports = { createBoutiquesTable };
