const pool = require('../config/db');

const createRolePermissionsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS role_permissions (
      id SERIAL PRIMARY KEY,
      boutique_id INT REFERENCES boutiques(id) ON DELETE CASCADE,
      role VARCHAR(50) NOT NULL,
      name VARCHAR(100),
      description TEXT,
      color VARCHAR(50),
      is_system BOOLEAN DEFAULT FALSE,
      permissions JSONB NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(boutique_id, role)
    );
  `);
  console.log('✓ role_permissions table ready');
};

const DEFAULT_SYSTEM_ROLES = [
  { role: 'owner', name: 'Owner', description: 'Full system access. Can manage users, settings, and all data.', color: 'bg-[#8338EC]/10 text-[#6200EA] ring-[#8338EC]/20', is_system: true, permissions: { 'Dashboard': 'Full', 'CRM': 'Full', 'Orders': 'Full', 'Production': 'Full', 'Measurements': 'Full', 'Inventory': 'Full', 'Billing': 'Full', 'Staff Management': 'Full', 'Marketing': 'Full', 'Admin Settings': 'Full' } }
];
const initializeDefaultRoles = async (boutique_id) => {
  for (const roleDef of DEFAULT_SYSTEM_ROLES) {
    await pool.query(
      `INSERT INTO role_permissions (boutique_id, role, name, description, color, is_system, permissions)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (boutique_id, role) DO NOTHING`,
      [boutique_id, roleDef.role, roleDef.name, roleDef.description, roleDef.color, roleDef.is_system, roleDef.permissions]
    );
  }
};

module.exports = { createRolePermissionsTable, initializeDefaultRoles, DEFAULT_SYSTEM_ROLES };
