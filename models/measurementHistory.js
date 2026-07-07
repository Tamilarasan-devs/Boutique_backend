const pool = require('../config/db');

// Create the measurement_history table if it doesn't exist
const createMeasurementHistoryTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS measurement_history (
      id SERIAL PRIMARY KEY,
      boutique_id INT NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
      customer_id INTEGER REFERENCES customers(id),
      template_id INTEGER REFERENCES measurement_templates(id),
      measurements JSONB,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(query);
    console.log('Measurement history table verified/created');
  } catch (error) {
    console.error('Error creating measurement history table:', error);
  }
};

module.exports = {
  createMeasurementHistoryTable,
};
