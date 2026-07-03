const pool = require('../config/db');

const createEmployeesTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS employees (
      id SERIAL PRIMARY KEY,
      boutique_id INT NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100),
      phone VARCHAR(20),
      role VARCHAR(50) NOT NULL DEFAULT 'Other',
      salary NUMERIC(10,2) DEFAULT 0,
      join_date DATE DEFAULT CURRENT_DATE,
      status VARCHAR(20) NOT NULL DEFAULT 'Active',
      address TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(query);
    console.log('Employees table verified/created');
  } catch (error) {
    console.error('Error creating employees table:', error);
  }
};

module.exports = { createEmployeesTable };
