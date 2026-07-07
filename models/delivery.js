const pool = require('../config/db');

const createDeliveriesTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS deliveries (
      id SERIAL PRIMARY KEY,
      boutique_id INT NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
      order_id VARCHAR(50),
      customer_name VARCHAR(100) NOT NULL,
      phone VARCHAR(20),
      garment VARCHAR(150) NOT NULL,
      ready_date DATE NOT NULL,
      delivery_date DATE,
      delivery_method VARCHAR(50) DEFAULT 'Pickup',
      tracking_number VARCHAR(100),
      status VARCHAR(50) DEFAULT 'Ready for Pickup',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(query);
    console.log('Deliveries table verified/created');
  } catch (error) {
    console.error('Error creating deliveries table:', error);
  }
};

module.exports = { createDeliveriesTable };
