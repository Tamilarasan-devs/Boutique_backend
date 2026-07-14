const pool = require('../config/db');

// @desc    Get all products for a boutique
// @route   GET /api/products
// @access  Private
const getProducts = async (req, res) => {
  const boutique_id = req.user.boutique_id;

  try {
    const result = await pool.query(
      `SELECT * FROM products 
       WHERE boutique_id = $1 
       ORDER BY created_at DESC`,
      [boutique_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching products:', err.message);
    res.status(500).json({ error: 'Server error fetching products' });
  }
};

// @desc    Create a new product
// @route   POST /api/products
// @access  Private
const createProduct = async (req, res) => {
  const boutique_id = req.user.boutique_id;
  const { name, description, price, stock_quantity, category, image_url, image_urls } = req.body;

  if (!name || !price) {
    return res.status(400).json({ error: 'Name and price are required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO products 
        (boutique_id, name, description, price, stock_quantity, category, image_url, image_urls)
       VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        boutique_id, 
        name, 
        description, 
        price, 
        stock_quantity || 0, 
        category, 
        image_url,
        image_urls ? JSON.stringify(image_urls) : '[]'
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating product:', err.message);
    res.status(500).json({ error: 'Server error creating product' });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private
const updateProduct = async (req, res) => {
  const { id } = req.params;
  const boutique_id = req.user.boutique_id;
  const { name, description, price, stock_quantity, category, image_url, image_urls } = req.body;

  try {
    const result = await pool.query(
      `UPDATE products 
       SET name = $1, description = $2, price = $3, stock_quantity = $4, category = $5, image_url = $6, image_urls = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 AND boutique_id = $9 
       RETURNING *`,
      [name, description, price, stock_quantity, category, image_url, image_urls ? JSON.stringify(image_urls) : '[]', id, boutique_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating product:', err.message);
    res.status(500).json({ error: 'Server error updating product' });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private
const deleteProduct = async (req, res) => {
  const { id } = req.params;
  const boutique_id = req.user.boutique_id;

  try {
    const result = await pool.query(
      `DELETE FROM products 
       WHERE id = $1 AND boutique_id = $2 
       RETURNING id`,
      [id, boutique_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Error deleting product:', err.message);
    res.status(500).json({ error: 'Server error deleting product' });
  }
};

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct
};
