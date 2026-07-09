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

// Default system role definitions (matching backend and frontend expectations)
const defaultRolePermissions = {
  owner: { 'Dashboard': 'Full', 'CRM': 'Full', 'Orders': 'Full', 'Production': 'Full', 'Measurements': 'Full', 'Inventory': 'Full', 'Billing': 'Full', 'Staff Management': 'Full', 'Marketing': 'Full', 'Admin Settings': 'Full' },
  manager: { 'Dashboard': 'Full', 'CRM': 'Full', 'Orders': 'Full', 'Production': 'Full', 'Measurements': 'Full', 'Inventory': 'Full', 'Billing': 'Full', 'Staff Management': 'Full', 'Marketing': 'Full', 'Admin Settings': 'None' },
  sales_staff: { 'Dashboard': 'Read', 'CRM': 'Full', 'Orders': 'Full', 'Production': 'None', 'Measurements': 'Read', 'Inventory': 'None', 'Billing': 'Full', 'Staff Management': 'None', 'Marketing': 'Full', 'Admin Settings': 'None' },
  tailor: { 'Dashboard': 'Read', 'CRM': 'None', 'Orders': 'Read', 'Production': 'Full', 'Measurements': 'Full', 'Inventory': 'Read', 'Billing': 'None', 'Staff Management': 'None', 'Marketing': 'None', 'Admin Settings': 'None' },
  receptionist: { 'Dashboard': 'Read', 'CRM': 'Full', 'Orders': 'Read', 'Production': 'None', 'Measurements': 'None', 'Inventory': 'None', 'Billing': 'Read', 'Staff Management': 'None', 'Marketing': 'None', 'Admin Settings': 'None' }
};

exports.getRoles = async (req, res) => {
  const boutique_id = req.user.boutique_id;
  try {
    const result = await pool.query('SELECT role, permissions FROM role_permissions WHERE boutique_id = $1', [boutique_id]);
    
    // Convert array of { role, permissions } to a map
    const customPermissions = {};
    result.rows.forEach(row => {
      customPermissions[row.role] = row.permissions;
    });

    // Merge defaults with custom permissions
    const finalPermissions = {};
    Object.keys(defaultRolePermissions).forEach(role => {
      finalPermissions[role] = customPermissions[role] || defaultRolePermissions[role];
    });

    res.json(finalPermissions);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ message: 'Server error fetching roles' });
  }
};

exports.updateRolePermissions = async (req, res) => {
  const boutique_id = req.user.boutique_id;
  const { role } = req.params;
  const { permissions } = req.body;

  if (role === 'owner') {
    return res.status(403).json({ message: 'Cannot modify owner permissions' });
  }

  if (!defaultRolePermissions[role]) {
    return res.status(404).json({ message: 'Role not found' });
  }

  if (typeof permissions !== 'object' || permissions === null || Array.isArray(permissions)) {
    return res.status(400).json({ message: 'Permissions must be an object' });
  }

  try {
    const query = `
      INSERT INTO role_permissions (boutique_id, role, permissions)
      VALUES ($1, $2, $3)
      ON CONFLICT (boutique_id, role) 
      DO UPDATE SET permissions = EXCLUDED.permissions, updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    const result = await pool.query(query, [boutique_id, role, JSON.stringify(permissions)]);
    
    res.json({ message: 'Role permissions updated', data: result.rows[0] });
  } catch (error) {
    console.error('Error updating role permissions:', error);
    res.status(500).json({ message: 'Server error updating role permissions' });
  }
};
