const pool = require('../config/db');

const createSubscriptionsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS subscriptions (
      id SERIAL PRIMARY KEY,
      razorpay_customer_id VARCHAR(100),
      razorpay_subscription_id VARCHAR(100) UNIQUE,
      plan_id VARCHAR(100),
      status VARCHAR(20) DEFAULT 'inactive', -- active, halted, cancelled, completed, inactive, trialing, expired
      current_period_end TIMESTAMP,
      trial_end TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Insert a default mock record for the single-tenant CRM (id=1)
    INSERT INTO subscriptions (id, status, trial_end)
    VALUES (1, 'trialing', CURRENT_TIMESTAMP + INTERVAL '15 days')
    ON CONFLICT (id) DO NOTHING;
  `;
  try {
    await pool.query(query);
    console.log('Subscriptions table verified/created');
  } catch (error) {
    console.error('Error creating subscriptions table:', error);
  }
};

module.exports = { createSubscriptionsTable };
