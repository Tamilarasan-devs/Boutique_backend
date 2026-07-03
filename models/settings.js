const pool = require('../config/db');

const createSettingsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS boutique_settings (
      id SERIAL PRIMARY KEY,
      boutique_id INT NOT NULL UNIQUE REFERENCES boutiques(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL DEFAULT 'Boutique CRM',
      tagline VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(50),
      gst VARCHAR(50),
      pan VARCHAR(50),
      address TEXT,
      city VARCHAR(100),
      state VARCHAR(100) DEFAULT 'Maharashtra',
      pincode VARCHAR(20),
      website VARCHAR(255),
      currency VARCHAR(10) DEFAULT 'INR',
      invoice_prefix VARCHAR(20) DEFAULT 'INV',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(query);
    console.log('Boutique Settings table ensured');
  } catch (err) {
    console.error('Error creating boutique_settings table:', err);
  }
};

module.exports = createSettingsTable;
