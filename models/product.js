const pool = require('../config/db');

const createProductsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      boutique_id INT NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price DECIMAL(10, 2) NOT NULL,
      stock_quantity INT NOT NULL DEFAULT 0,
      category VARCHAR(100),
      image_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(query);
    console.log('Products table verified/created');
  } catch (error) {
    console.error('Error creating products table:', error);
  }
};

module.exports = { createProductsTable };
