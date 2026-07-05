const pool = require('../config/db');

/**
 * runMigrations — safely brings the production DB schema up to date.
 * Uses ADD COLUMN IF NOT EXISTS so it's idempotent (safe to run every startup).
 */
const runMigrations = async () => {
  try {
    // ── 1. Ensure boutiques table exists (required before users references it) ──
    await pool.query(`
      CREATE TABLE IF NOT EXISTS boutiques (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ── 2. Add boutique_id to users if missing (old schema didn't have it) ─────
    await pool.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS boutique_id INT REFERENCES boutiques(id) ON DELETE CASCADE;
    `);

    // ── 3. Ensure is_active column exists ─────────────────────────────────────
    await pool.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
    `).catch(() => {});

    // ── 4. Ensure boutique_settings table exists with name column ─────────────
    await pool.query(`
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
    `);

    // ── 5. Add name column to boutique_settings if missing ────────────────────
    await pool.query(`
      ALTER TABLE boutique_settings
        ADD COLUMN IF NOT EXISTS name VARCHAR(255) NOT NULL DEFAULT 'Boutique CRM';
    `).catch(() => {});

    console.log('✓ Migrations complete');
  } catch (err) {
    console.error('Migration error:', err.message);
    // Don't crash the server — log and continue
  }
};

module.exports = { runMigrations };
