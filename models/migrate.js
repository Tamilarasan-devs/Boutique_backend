const pool = require('../config/db');

/**
 * runMigrations — comprehensive idempotent migration.
 * Adds missing columns to ALL tables that were created before the multi-tenant schema.
 * Safe to run on every server startup.
 */
const runMigrations = async () => {
  // Helper: run SQL silently — won't crash if column already exists
  const run = async (sql, label) => {
    try {
      await pool.query(sql);
    } catch (e) {
      if (!e.message.includes('already exists') && !e.message.includes('duplicate')) {
        console.warn(`[migrate] ${label}:`, e.message);
      }
    }
  };

  try {
    console.log('[migrate] Starting schema migrations...');

    // ── STEP 1: boutiques table (must exist first — FK parent) ───────────────
    await run(`
      CREATE TABLE IF NOT EXISTS boutiques (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `, 'boutiques table');

    // ── STEP 2: users table — add missing columns ────────────────────────────
    await run(`ALTER TABLE users ADD COLUMN IF NOT EXISTS boutique_id INT REFERENCES boutiques(id) ON DELETE CASCADE;`, 'users.boutique_id');
    await run(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;`, 'users.is_active');
    await run(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) NOT NULL DEFAULT 'sales_staff';`, 'users.role');

    // ── STEP 3: boutique_settings — create minimal shell, then patch columns ─
    await run(`
      CREATE TABLE IF NOT EXISTS boutique_settings (
        id SERIAL PRIMARY KEY,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `, 'boutique_settings table');

    await run(`ALTER TABLE boutique_settings ADD COLUMN IF NOT EXISTS boutique_id INT;`, 'boutique_settings.boutique_id');
    await run(`ALTER TABLE boutique_settings ADD COLUMN IF NOT EXISTS name VARCHAR(255) NOT NULL DEFAULT 'Boutique CRM';`, 'boutique_settings.name');
    await run(`ALTER TABLE boutique_settings ADD COLUMN IF NOT EXISTS tagline VARCHAR(255);`, 'boutique_settings.tagline');
    await run(`ALTER TABLE boutique_settings ADD COLUMN IF NOT EXISTS email VARCHAR(255);`, 'boutique_settings.email');
    await run(`ALTER TABLE boutique_settings ADD COLUMN IF NOT EXISTS phone VARCHAR(50);`, 'boutique_settings.phone');
    await run(`ALTER TABLE boutique_settings ADD COLUMN IF NOT EXISTS gst VARCHAR(50);`, 'boutique_settings.gst');
    await run(`ALTER TABLE boutique_settings ADD COLUMN IF NOT EXISTS pan VARCHAR(50);`, 'boutique_settings.pan');
    await run(`ALTER TABLE boutique_settings ADD COLUMN IF NOT EXISTS address TEXT;`, 'boutique_settings.address');
    await run(`ALTER TABLE boutique_settings ADD COLUMN IF NOT EXISTS city VARCHAR(100);`, 'boutique_settings.city');
    await run(`ALTER TABLE boutique_settings ADD COLUMN IF NOT EXISTS state VARCHAR(100) DEFAULT 'Maharashtra';`, 'boutique_settings.state');
    await run(`ALTER TABLE boutique_settings ADD COLUMN IF NOT EXISTS pincode VARCHAR(20);`, 'boutique_settings.pincode');
    await run(`ALTER TABLE boutique_settings ADD COLUMN IF NOT EXISTS website VARCHAR(255);`, 'boutique_settings.website');
    await run(`ALTER TABLE boutique_settings ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'INR';`, 'boutique_settings.currency');
    await run(`ALTER TABLE boutique_settings ADD COLUMN IF NOT EXISTS invoice_prefix VARCHAR(20) DEFAULT 'INV';`, 'boutique_settings.invoice_prefix');

    // Unique constraint on boutique_settings.boutique_id
    await run(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'boutique_settings_boutique_id_key') THEN
          ALTER TABLE boutique_settings ADD CONSTRAINT boutique_settings_boutique_id_key UNIQUE (boutique_id);
        END IF;
      END $$;
    `, 'boutique_settings unique constraint');

    // ── STEP 4: customers ─────────────────────────────────────────────────────
    await run(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS boutique_id INT REFERENCES boutiques(id) ON DELETE CASCADE;`, 'customers.boutique_id');

    // ── STEP 5: appointments ──────────────────────────────────────────────────
    await run(`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS boutique_id INT REFERENCES boutiques(id) ON DELETE CASCADE;`, 'appointments.boutique_id');
    await run(`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS phone VARCHAR(20);`, 'appointments.phone');
    await run(`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(100);`, 'appointments.assigned_to');

    // ── STEP 6: followups ─────────────────────────────────────────────────────
    await run(`ALTER TABLE followups ADD COLUMN IF NOT EXISTS boutique_id INT REFERENCES boutiques(id) ON DELETE CASCADE;`, 'followups.boutique_id');
    await run(`ALTER TABLE followups ADD COLUMN IF NOT EXISTS notes TEXT;`, 'followups.notes');

    // ── STEP 7: orders ────────────────────────────────────────────────────────
    await run(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS boutique_id INT REFERENCES boutiques(id) ON DELETE CASCADE;`, 'orders.boutique_id');
    await run(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_date DATE DEFAULT CURRENT_DATE;`, 'orders.order_date');
    await run(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS tailor VARCHAR(100);`, 'orders.tailor');
    await run(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS fabric_details TEXT;`, 'orders.fabric_details');
    await run(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS priority VARCHAR(50) DEFAULT 'Normal';`, 'orders.priority');
    await run(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS advance_paid NUMERIC(10,2);`, 'orders.advance_paid');
    await run(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS stitching_cost NUMERIC(10,2);`, 'orders.stitching_cost');

    // ── STEP 8: quotations ────────────────────────────────────────────────────
    await run(`ALTER TABLE quotations ADD COLUMN IF NOT EXISTS boutique_id INT REFERENCES boutiques(id) ON DELETE CASCADE;`, 'quotations.boutique_id');
    await run(`ALTER TABLE quotations ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(255);`, 'quotations.customer_phone');
    await run(`ALTER TABLE quotations ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);`, 'quotations.customer_email');
    await run(`ALTER TABLE quotations ADD COLUMN IF NOT EXISTS image_url TEXT;`, 'quotations.image_url');

    // ── STEP 9: production ────────────────────────────────────────────────────
    await run(`ALTER TABLE production ADD COLUMN IF NOT EXISTS boutique_id INT REFERENCES boutiques(id) ON DELETE CASCADE;`, 'production.boutique_id');

    // ── STEP 10: trials ───────────────────────────────────────────────────────
    await run(`ALTER TABLE trials ADD COLUMN IF NOT EXISTS boutique_id INT REFERENCES boutiques(id) ON DELETE CASCADE;`, 'trials.boutique_id');

    // ── STEP 11: deliveries ───────────────────────────────────────────────────
    await run(`ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS boutique_id INT REFERENCES boutiques(id) ON DELETE CASCADE;`, 'deliveries.boutique_id');

    // ── STEP 12: measurement_templates ───────────────────────────────────────
    await run(`ALTER TABLE measurement_templates ADD COLUMN IF NOT EXISTS boutique_id INT REFERENCES boutiques(id) ON DELETE CASCADE;`, 'measurement_templates.boutique_id');

    // ── STEP 13: measurement_history ─────────────────────────────────────────
    await run(`ALTER TABLE measurement_history ADD COLUMN IF NOT EXISTS boutique_id INT REFERENCES boutiques(id) ON DELETE CASCADE;`, 'measurement_history.boutique_id');

    // ── STEP 14: inventory (suppliers, inventory_items, purchases) ────────────
    await run(`ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS boutique_id INT REFERENCES boutiques(id) ON DELETE CASCADE;`, 'suppliers.boutique_id');
    await run(`ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS boutique_id INT REFERENCES boutiques(id) ON DELETE CASCADE;`, 'inventory_items.boutique_id');
    await run(`ALTER TABLE purchases ADD COLUMN IF NOT EXISTS boutique_id INT REFERENCES boutiques(id) ON DELETE CASCADE;`, 'purchases.boutique_id');

    // ── STEP 15: invoices & payments ─────────────────────────────────────────
    await run(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS boutique_id INT REFERENCES boutiques(id) ON DELETE CASCADE;`, 'invoices.boutique_id');
    await run(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS boutique_id INT REFERENCES boutiques(id) ON DELETE CASCADE;`, 'payments.boutique_id');

    // ── STEP 16: employees & attendance ──────────────────────────────────────
    await run(`ALTER TABLE employees ADD COLUMN IF NOT EXISTS boutique_id INT REFERENCES boutiques(id) ON DELETE CASCADE;`, 'employees.boutique_id');

    // ── STEP 17: leads ────────────────────────────────────────────────────────
    await run(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS boutique_id INT REFERENCES boutiques(id) ON DELETE CASCADE;`, 'leads.boutique_id');
    await run(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`, 'leads.updated_at');

    // ── STEP 18: email_logs ───────────────────────────────────────────────────
    await run(`ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS boutique_id INT REFERENCES boutiques(id) ON DELETE CASCADE;`, 'email_logs.boutique_id');

    // ── STEP 18b: role_permissions ───────────────────────────────────────────
    await run(`ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS name VARCHAR(100);`, 'role_permissions.name');
    await run(`ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS description TEXT;`, 'role_permissions.description');
    await run(`ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS color VARCHAR(50);`, 'role_permissions.color');
    await run(`ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT FALSE;`, 'role_permissions.is_system');

    // ── STEP 19: Sequence Table & Display IDs ─────────────────────────────────
    await run(`
      CREATE TABLE IF NOT EXISTS boutique_sequences (
        boutique_id INT REFERENCES boutiques(id) ON DELETE CASCADE,
        entity_type VARCHAR(50) NOT NULL,
        next_value INT NOT NULL DEFAULT 1,
        UNIQUE(boutique_id, entity_type)
      );
    `, 'boutique_sequences table');

    const tablesWithDisplayId = ['orders', 'quotations', 'production', 'trials', 'appointments', 'followups', 'leads', 'invoices', 'payments', 'deliveries'];
    for (const table of tablesWithDisplayId) {
      await run(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS display_id VARCHAR(50);`, `${table}.display_id`);
    }

    // ── STEP 20: Initialize Default Roles for all existing boutiques ───────────
    const { initializeDefaultRoles } = require('./rolePermissions');
    const { createMarketingCampaignsTable } = require('./marketingCampaign');
    await createMarketingCampaignsTable();
    const boutiquesResult = await pool.query('SELECT id FROM boutiques');
    for (const row of boutiquesResult.rows) {
      await initializeDefaultRoles(row.id);
    }

    console.log('[migrate] ✓ All migrations complete');
  } catch (err) {
    console.error('[migrate] Fatal error:', err.message);
    // Do NOT crash the server — just log and continue
  }
};

module.exports = { runMigrations };
