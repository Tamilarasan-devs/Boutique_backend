const pool = require('../config/db');

const createMarketingCampaignsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS marketing_campaigns (
      id SERIAL PRIMARY KEY,
      boutique_id INT REFERENCES boutiques(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      channel VARCHAR(50) DEFAULT 'Email',
      audience_count INT DEFAULT 0,
      status VARCHAR(50) DEFAULT 'Draft',
      subject VARCHAR(255),
      body TEXT,
      open_rate NUMERIC(5, 2) DEFAULT 0,
      sent_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✓ marketing_campaigns table ready');
};

module.exports = { createMarketingCampaignsTable };
