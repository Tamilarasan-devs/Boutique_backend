const pool = require('../config/db');

// Get company profile settings for the logged-in boutique
exports.getCompanyProfile = async (req, res) => {
  const boutique_id = req.user.boutique_id;
  try {
    const result = await pool.query('SELECT * FROM boutique_settings WHERE boutique_id = $1', [boutique_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Settings not found' });
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
    address, city, state, pincode, website, currency, invoicePrefix
  } = req.body;

  try {
    const updateQuery = `
      INSERT INTO boutique_settings (boutique_id, name, tagline, email, phone, gst, pan, address, city, state, pincode, website, currency, invoice_prefix)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
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
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const values = [
      boutique_id, name, tagline, email, phone, gst, pan,
      address, city, state, pincode, website, currency, invoicePrefix
    ];

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
