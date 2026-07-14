const pool = require('../config/db');

// Get company profile settings for the logged-in boutique
exports.getCompanyProfile = async (req, res) => {
  const boutique_id = req.user.boutique_id;
  try {
    const result = await pool.query('SELECT * FROM boutique_settings WHERE boutique_id = $1', [boutique_id]);
    if (result.rows.length === 0) {
      return res.json({ name: 'Your Boutique' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Server error fetching settings' });
  }
};

// Update company profile settings for the logged-in boutique
exports.updateCompanyProfile = async (req, res) => {
  const boutique_id = req.user.boutique_id;
  const {
    name, tagline, email, phone, gst, pan,
    address, city, state, pincode, website, currency, invoicePrefix,
    loyalty_enabled, points_per_unit, redemption_value
  } = req.body;

  try {
    const updateQuery = `
      INSERT INTO boutique_settings (boutique_id, name, tagline, email, phone, gst, pan, address, city, state, pincode, website, currency, invoice_prefix, loyalty_enabled, points_per_unit, redemption_value)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      ON CONFLICT (boutique_id) DO UPDATE SET
        name = COALESCE(EXCLUDED.name, boutique_settings.name),
        tagline = COALESCE(EXCLUDED.tagline, boutique_settings.tagline),
        email = COALESCE(EXCLUDED.email, boutique_settings.email),
        phone = COALESCE(EXCLUDED.phone, boutique_settings.phone),
        gst = COALESCE(EXCLUDED.gst, boutique_settings.gst),
        pan = COALESCE(EXCLUDED.pan, boutique_settings.pan),
        address = COALESCE(EXCLUDED.address, boutique_settings.address),
        city = COALESCE(EXCLUDED.city, boutique_settings.city),
        state = COALESCE(EXCLUDED.state, boutique_settings.state),
        pincode = COALESCE(EXCLUDED.pincode, boutique_settings.pincode),
        website = COALESCE(EXCLUDED.website, boutique_settings.website),
        currency = COALESCE(EXCLUDED.currency, boutique_settings.currency),
        invoice_prefix = COALESCE(EXCLUDED.invoice_prefix, boutique_settings.invoice_prefix),
        loyalty_enabled = COALESCE(EXCLUDED.loyalty_enabled, boutique_settings.loyalty_enabled),
        points_per_unit = COALESCE(EXCLUDED.points_per_unit, boutique_settings.points_per_unit),
        redemption_value = COALESCE(EXCLUDED.redemption_value, boutique_settings.redemption_value),
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const values = [
      boutique_id, name, tagline, email, phone, gst, pan,
      address, city, state, pincode, website, currency, invoicePrefix,
      loyalty_enabled, points_per_unit, redemption_value
    ].map(v => v === undefined ? null : v);

    const result = await pool.query(updateQuery, values);

    res.json({
      message: 'Settings updated successfully',
      settings: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ message: 'Server error updating settings' });
  }
};

exports.getRoles = async (req, res) => {
  const boutique_id = req.user.boutique_id;
  try {
    const rolesResult = await pool.query('SELECT * FROM role_permissions WHERE boutique_id = $1 ORDER BY is_system DESC, name ASC', [boutique_id]);
    const usersResult = await pool.query('SELECT role, COUNT(*) as count FROM users WHERE boutique_id = $1 GROUP BY role', [boutique_id]);
    
    const userCounts = {};
    usersResult.rows.forEach(row => {
      userCounts[row.role] = parseInt(row.count, 10);
    });

    const finalRoles = rolesResult.rows.map(row => ({
      id: row.role,
      name: row.name,
      description: row.description,
      color: row.color,
      is_system: row.is_system || false,
      permissions: row.permissions,
      users: userCounts[row.role] || 0
    }));

    res.json(finalRoles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ message: 'Server error fetching roles' });
  }
};

exports.createRole = async (req, res) => {
  const boutique_id = req.user.boutique_id;
  const { name, description, color, permissions } = req.body;

  if (!name || typeof permissions !== 'object') {
    return res.status(400).json({ message: 'Name and permissions are required' });
  }

  const roleKey = name.toLowerCase().replace(/[^a-z0-9]/g, '_');

  try {
    // Check if exists
    const existing = await pool.query('SELECT 1 FROM role_permissions WHERE boutique_id = $1 AND role = $2', [boutique_id, roleKey]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'A role with this name already exists' });
    }

    const query = `
      INSERT INTO role_permissions (boutique_id, role, name, description, color, is_system, permissions)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const result = await pool.query(query, [boutique_id, roleKey, name, description, color || 'bg-gray-100 text-gray-800 ring-gray-200', false, JSON.stringify(permissions)]);
    
    res.status(201).json({ message: 'Role created', data: result.rows[0] });
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ message: 'Server error creating role' });
  }
};

exports.updateRolePermissions = async (req, res) => {
  const boutique_id = req.user.boutique_id;
  const { role } = req.params;
  const { permissions, name, description, color } = req.body;

  if (role === 'owner' && permissions) {
    return res.status(403).json({ message: 'Cannot modify owner permissions' });
  }

  try {
    const existing = await pool.query('SELECT is_system FROM role_permissions WHERE boutique_id = $1 AND role = $2', [boutique_id, role]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Role not found' });
    }

    const query = `
      UPDATE role_permissions 
      SET 
        permissions = COALESCE($1, permissions), 
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        color = COALESCE($4, color),
        updated_at = CURRENT_TIMESTAMP
      WHERE boutique_id = $5 AND role = $6
      RETURNING *;
    `;
    
    const result = await pool.query(query, [
      permissions ? JSON.stringify(permissions) : null,
      name,
      description,
      color,
      boutique_id, 
      role
    ]);
    
    res.json({ message: 'Role updated', data: result.rows[0] });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ message: 'Server error updating role' });
  }
};

exports.deleteRole = async (req, res) => {
  const boutique_id = req.user.boutique_id;
  const { role } = req.params;

  try {
    const existing = await pool.query('SELECT is_system FROM role_permissions WHERE boutique_id = $1 AND role = $2', [boutique_id, role]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Role not found' });
    }
    if (existing.rows[0].is_system) {
      return res.status(403).json({ message: 'Cannot delete a system role' });
    }
    // Check if any users have this role
    const usersResult = await pool.query('SELECT COUNT(*) FROM users WHERE boutique_id = $1 AND role = $2', [boutique_id, role]);
    if (parseInt(usersResult.rows[0].count, 10) > 0) {
      return res.status(400).json({ message: 'Cannot delete role as it is assigned to users. Reassign users first.' });
    }

    await pool.query('DELETE FROM role_permissions WHERE boutique_id = $1 AND role = $2', [boutique_id, role]);
    res.json({ message: 'Role deleted' });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({ message: 'Server error deleting role' });
  }
};
