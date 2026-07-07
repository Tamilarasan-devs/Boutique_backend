const pool = require('../config/db');

// Create the customers table if it doesn't exist
const createCustomersTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      boutique_id INT NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100),
      phone VARCHAR(20),
      address TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(query);
    console.log('Customers table verified/created');
  } catch (error) {
    console.error('Error creating customers table:', error);
  }
};

module.exports = {
  createCustomersTable,
};
