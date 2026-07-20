const pool = require('../config/db');

const createInvoicesTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS invoices (
      id SERIAL PRIMARY KEY,
      boutique_id INT NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
      invoice_number VARCHAR(50) UNIQUE NOT NULL,
      order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
      quotation_id INTEGER REFERENCES quotations(id) ON DELETE SET NULL,
      customer_name VARCHAR(100) NOT NULL,
      invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
      due_date DATE NOT NULL,
      total_amount NUMERIC(10, 2) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'Pending',
      items TEXT NOT NULL,
      invoice_type VARCHAR(50) DEFAULT 'Standard',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(query);
    console.log('Invoices table verified/created');
  } catch (error) {
    console.error('Error creating invoices table:', error);
  }
};

module.exports = { createInvoicesTable };
