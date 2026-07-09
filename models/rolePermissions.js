const pool = require('../config/db');

const createRolePermissionsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS role_permissions (
      id SERIAL PRIMARY KEY,
      boutique_id INT REFERENCES boutiques(id) ON DELETE CASCADE,
      role VARCHAR(50) NOT NULL,
      permissions JSONB NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(boutique_id, role)
    );
  `);
  console.log('✓ role_permissions table ready');
};

module.exports = { createRolePermissionsTable };
