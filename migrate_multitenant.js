/**
 * Multi-Tenant Migration Script
 * Drops all existing tables and recreates them with boutique_id support.
 * WARNING: This will DELETE all data in the database.
 */
const pool = require('./config/db');

const run = async () => {
  const client = await pool.connect();
  try {
    console.log('🔴 Dropping all existing tables...');
    await client.query(`
      DROP TABLE IF EXISTS
        stock_ledger, purchases, inventory_items, suppliers,
        email_logs, attendance, employees,
        payments, invoices,
        measurement_history, measurement_templates,
        deliveries, trials, production, quotations,
        followups, appointments, orders, leads,
        boutique_settings, subscriptions,
        users, boutiques
      CASCADE;
    `);
    console.log('✅ All tables dropped.');
    console.log('🟢 Now restart your backend server to recreate tables with multi-tenant support.');
  } catch (err) {
    console.error('Migration error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
};

run();
