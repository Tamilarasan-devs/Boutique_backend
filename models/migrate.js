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

    // ── 4. Ensure boutique_settings table exists (minimal — alters fill the rest) ──
    await pool.query(`
      CREATE TABLE IF NOT EXISTS boutique_settings (
        id SERIAL PRIMARY KEY,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ── 5. Patch ALL possibly missing columns in boutique_settings ────────────
    //    Each runs separately so one failure doesn't block the rest.
    const settingsAlters = [
      `ALTER TABLE boutique_settings ADD COLUMN IF NOT EXISTS boutique_id INT;`,
      `ALTER TABLE boutique_settings ADD COLUMN IF NOT EXISTS name VARCHAR(255) NOT NULL DEFAULT 'Boutique CRM';`,
      `ALTER TABLE boutique_settings ADD COLUMN IF NOT EXISTS tagline VARCHAR(255);`,
      `ALTER TABLE boutique_settings ADD COLUMN IF NOT EXISTS email VARCHAR(255);`,
      `ALTER TABLE boutique_settings ADD COLUMN IF NOT EXISTS phone VARCHAR(50);`,
      `ALTER TABLE boutique_settings ADD COLUMN IF NOT EXISTS gst VARCHAR(50);`,
      `ALTER TABLE boutique_settings ADD COLUMN IF NOT EXISTS pan VARCHAR(50);`,
      `ALTER TABLE boutique_settings ADD COLUMN IF NOT EXISTS address TEXT;`,
      `ALTER TABLE boutique_settings ADD COLUMN IF NOT EXISTS city VARCHAR(100);`,
      `ALTER TABLE boutique_settings ADD COLUMN IF NOT EXISTS state VARCHAR(100) DEFAULT 'Maharashtra';`,
      `ALTER TABLE boutique_settings ADD COLUMN IF NOT EXISTS pincode VARCHAR(20);`,
      `ALTER TABLE boutique_settings ADD COLUMN IF NOT EXISTS website VARCHAR(255);`,
      `ALTER TABLE boutique_settings ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'INR';`,
      `ALTER TABLE boutique_settings ADD COLUMN IF NOT EXISTS invoice_prefix VARCHAR(20) DEFAULT 'INV';`,
    ];

    for (const sql of settingsAlters) {
      await pool.query(sql).catch((e) => {
        if (!e.message.includes('already exists')) {
          console.warn('boutique_settings alter warning:', e.message);
        }
      });
    }

    // ── 6. Add unique constraint on boutique_settings.boutique_id if missing ──
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'boutique_settings_boutique_id_key'
        ) THEN
          ALTER TABLE boutique_settings ADD CONSTRAINT boutique_settings_boutique_id_key UNIQUE (boutique_id);
        END IF;
      END $$;
    `).catch(() => {});

    console.log('✓ Migrations complete');
  } catch (err) {
    console.error('Migration error:', err.message);
    // Don't crash the server — log and continue
  }
};

module.exports = { runMigrations };
