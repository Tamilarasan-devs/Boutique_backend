const pool = require('../config/db');

// Create the measurement_templates table if it doesn't exist
const createMeasurementTemplatesTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS measurement_templates (
      id SERIAL PRIMARY KEY,
      boutique_id INT NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
      customer_id INTEGER REFERENCES customers(id),
      name VARCHAR(255) NOT NULL,
      category VARCHAR(50),
      garment_type VARCHAR(100),
      fields JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(query);
    console.log('Measurement templates table verified/created');
  } catch (error) {
    console.error('Error creating measurement templates table:', error);
  }
};

module.exports = {
  createMeasurementTemplatesTable,
};
