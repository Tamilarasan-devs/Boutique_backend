const pool = require('../config/db');

const createEmailLogsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS email_logs (
      id SERIAL PRIMARY KEY,
      boutique_id INT REFERENCES boutiques(id) ON DELETE CASCADE,
      to_email VARCHAR(255) NOT NULL,
      sender_email VARCHAR(255),
      to_name VARCHAR(255),
      subject VARCHAR(500) NOT NULL,
      message TEXT NOT NULL,
      template_name VARCHAR(100),
      status VARCHAR(20) NOT NULL DEFAULT 'sent',
      error_message TEXT,
      sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(query);
    console.log('Email logs table verified/created');
  } catch (error) {
    console.error('Error creating email_logs table:', error);
  }
};

module.exports = { createEmailLogsTable };
