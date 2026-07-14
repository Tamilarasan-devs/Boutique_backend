const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'boutique_crm_secret_key';
const JWT_EXPIRES_IN = '7d';

// ─── Helper: sign token ───────────────────────────────────────────────────────
const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name, boutique_id: user.boutique_id },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

// ─── POST /api/auth/register ─────────────────────────────────────────────────
// Register a new Owner account — creates an isolated Boutique for them.
const register = async (req, res) => {
  const { name, email, password, boutiqueName } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  try {
    // 1. Create a new boutique (tenant) for this owner
    const boutiqueResult = await pool.query(
      `INSERT INTO boutiques (name) VALUES ($1) RETURNING id`,
      [boutiqueName || `${name}'s Boutique`]
    );
    const boutique_id = boutiqueResult.rows[0].id;

    // 2. Create the owner user linked to this boutique
    const password_hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (boutique_id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, 'owner') RETURNING id, name, email, role, boutique_id`,
      [boutique_id, name, email, password_hash]
    );

    // 3. Auto-create a settings row for this boutique
    await pool.query(
      `INSERT INTO boutique_settings (boutique_id, name) VALUES ($1, $2) ON CONFLICT (boutique_id) DO NOTHING`,
      [boutique_id, boutiqueName || `${name}'s Boutique`]
    );

    // 4. Initialize default roles for this boutique
    const { initializeDefaultRoles } = require('../models/rolePermissions');
    await initializeDefaultRoles(boutique_id);

    const user = result.rows[0];
    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email is already registered.' });
    }
    console.error('Register error:', err.message, '| code:', err.code, '| detail:', err.detail, '| stack:', err.stack);
    res.status(500).json({ error: 'Server error during registration.', detail: err.message });
  }
};

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = TRUE',
      [email]
    );
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'User not found. Please check your email.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }

    // Fetch custom permissions for this role and boutique
    let permissions = {};
    const permResult = await pool.query(
      'SELECT permissions FROM role_permissions WHERE boutique_id = $1 AND role = $2',
      [user.boutique_id, user.role]
    );
    if (permResult.rows.length > 0) {
      permissions = permResult.rows[0].permissions;
    }

    const token = signToken(user);
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, boutique_id: user.boutique_id, permissions }
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Server error during login.' });
  }
};

// ─── POST /api/auth/create-user ───────────────────────────────────────────────
// Owner creates a staff account within their boutique.
const createUser = async (req, res) => {
  const { name, email, password, role } = req.body;
  const boutique_id = req.user.boutique_id;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Name, email, password, and role are required.' });
  }

  try {
    const roleCheck = await pool.query('SELECT 1 FROM role_permissions WHERE boutique_id = $1 AND role = $2', [boutique_id, role]);
    if (roleCheck.rows.length === 0) {
      return res.status(400).json({ error: `Invalid role: ${role}` });
    }
    const password_hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (boutique_id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, is_active, created_at`,
      [boutique_id, name, email, password_hash, role]
    );
    res.status(201).json({ message: 'User created successfully.', user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email is already registered.' });
    }
    console.error('Create user error:', err.message);
    res.status(500).json({ error: 'Server error while creating user.' });
  }
};

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, boutique_id, name, email, role, is_active, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const user = result.rows[0];

    let permissions = {};
    const permResult = await pool.query(
      'SELECT permissions FROM role_permissions WHERE boutique_id = $1 AND role = $2',
      [user.boutique_id, user.role]
    );
    if (permResult.rows.length > 0) {
      permissions = permResult.rows[0].permissions;
    }

    res.json({ ...user, permissions });
  } catch (err) {
    console.error('GetMe error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
};

// ─── GET /api/auth/users ──────────────────────────────────────────────────────
// Owner lists all staff users within their boutique.
const getUsers = async (req, res) => {
  const boutique_id = req.user.boutique_id;
  try {
    const result = await pool.query(
      "SELECT id, name, email, role, is_active, created_at FROM users WHERE role != 'owner' AND boutique_id = $1 ORDER BY created_at DESC",
      [boutique_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('GetUsers error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
};

// ─── PUT /api/auth/users/:id ──────────────────────────────────────────────────
// Owner updates or deactivates a staff user.
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, role, is_active } = req.body;
  const boutique_id = req.user.boutique_id;
  
  try {
    if (role) {
      const roleCheck = await pool.query('SELECT 1 FROM role_permissions WHERE boutique_id = $1 AND role = $2', [boutique_id, role]);
      if (roleCheck.rows.length === 0) {
        return res.status(400).json({ error: `Invalid role: ${role}` });
      }
    }
    const result = await pool.query(
      `UPDATE users SET name = COALESCE($1, name), role = COALESCE($2, role), is_active = COALESCE($3, is_active)
       WHERE id = $4 AND role != 'owner' RETURNING id, name, email, role, is_active`,
      [name, role, is_active, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({ message: 'User updated.', user: result.rows[0] });
  } catch (err) {
    console.error('UpdateUser error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
};

// ─── DELETE /api/auth/users/:id ───────────────────────────────────────────────
const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM users WHERE id = $1 AND role != 'owner' RETURNING id",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found or cannot delete owner.' });
    }
    res.json({ message: 'User deleted.' });
  } catch (err) {
    console.error('DeleteUser error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
};

// ─── POST /api/auth/check-owner ───────────────────────────────────────────────
// Public: check if owner exists (to show Register vs Login on first launch)
const checkOwnerExists = async (req, res) => {
  try {
    const result = await pool.query("SELECT id FROM users WHERE role = 'owner' LIMIT 1");
    res.json({ ownerExists: result.rows.length > 0 });
  } catch (err) {
    console.error('CheckOwner error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = { register, login, createUser, getMe, getUsers, updateUser, deleteUser, checkOwnerExists };
