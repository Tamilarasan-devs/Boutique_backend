const pool = require('../config/db');

const createSuppliersTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS suppliers (
      id SERIAL PRIMARY KEY,
      boutique_id INT NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
      name VARCHAR(150) NOT NULL,
      contact VARCHAR(100),
      email VARCHAR(100),
      phone VARCHAR(50),
      location VARCHAR(255),
      category VARCHAR(100),
      rating INTEGER DEFAULT 5,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(query);
    console.log('Suppliers table verified/created');
  } catch (error) {
    console.error('Error creating suppliers table:', error);
  }
};

const createInventoryItemsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS inventory_items (
      id SERIAL PRIMARY KEY,
      boutique_id INT NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
      code VARCHAR(50) NOT NULL,
      name VARCHAR(150) NOT NULL,
      type VARCHAR(50) NOT NULL, -- 'Fabric' or 'Accessory'
      color VARCHAR(50),
      stock NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
      min_stock NUMERIC(10, 2) NOT NULL DEFAULT 10.00,
      price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
      unit VARCHAR(50) DEFAULT 'meters',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(boutique_id, code)
    );
  `;
  try {
    await pool.query(query);
    console.log('Inventory Items table verified/created');
  } catch (error) {
    console.error('Error creating inventory_items table:', error);
  }
};

const createPurchasesTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS purchases (
      id SERIAL PRIMARY KEY,
      boutique_id INT NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
      po_number VARCHAR(50) NOT NULL,
      supplier VARCHAR(150) NOT NULL,
      items TEXT NOT NULL,
      total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
      date DATE NOT NULL DEFAULT CURRENT_DATE,
      status VARCHAR(50) DEFAULT 'Ordered', -- 'Ordered', 'In Transit', 'Received', 'Cancelled'
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(boutique_id, po_number)
    );
  `;
  try {
    await pool.query(query);
    console.log('Purchases table verified/created');
  } catch (error) {
    console.error('Error creating purchases table:', error);
  }
};

const createStockLedgerTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS stock_ledger (
      id SERIAL PRIMARY KEY,
      boutique_id INT NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
      item_name VARCHAR(150) NOT NULL,
      item_code VARCHAR(50) NOT NULL,
      type VARCHAR(50) NOT NULL, -- 'Stock In' or 'Stock Out'
      quantity NUMERIC(10, 2) NOT NULL,
      unit VARCHAR(50) NOT NULL,
      reason VARCHAR(255),
      updated_by VARCHAR(100) DEFAULT 'Admin',
      date DATE NOT NULL DEFAULT CURRENT_DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(query);
    console.log('Stock Ledger table verified/created');
  } catch (error) {
    console.error('Error creating stock_ledger table:', error);
  }
};

const initInventoryDB = async () => {
  await createSuppliersTable();
  await createInventoryItemsTable();
  await createPurchasesTable();
  await createStockLedgerTable();
};

module.exports = {
  initInventoryDB
};
