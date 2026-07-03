const pool = require('./config/db');

async function inspect() {
  try {
    const suppliers = await pool.query('SELECT COUNT(*) FROM suppliers');
    const items = await pool.query('SELECT COUNT(*) FROM inventory_items');
    const purchases = await pool.query('SELECT COUNT(*) FROM purchases');
    const ledger = await pool.query('SELECT COUNT(*) FROM stock_ledger');
    const customers = await pool.query('SELECT COUNT(*) FROM customers');
    const orders = await pool.query('SELECT COUNT(*) FROM orders');
    const payments = await pool.query('SELECT COUNT(*) FROM payments');
    const invoices = await pool.query('SELECT COUNT(*) FROM invoices');

    console.log('--- DATABASE INSPECTION ---');
    console.log('Suppliers:', suppliers.rows[0].count);
    console.log('Inventory Items:', items.rows[0].count);
    console.log('Purchases:', purchases.rows[0].count);
    console.log('Stock Ledger Logs:', ledger.rows[0].count);
    console.log('Customers:', customers.rows[0].count);
    console.log('Orders:', orders.rows[0].count);
    console.log('Invoices:', invoices.rows[0].count);
    console.log('Payments:', payments.rows[0].count);

    if (parseInt(items.rows[0].count, 10) > 0) {
      console.log('\nSample Inventory Items:');
      const sampleItems = await pool.query('SELECT * FROM inventory_items LIMIT 3');
      console.log(sampleItems.rows);
    }
  } catch (err) {
    console.error('Inspection failed:', err.message);
  }
  process.exit(0);
}

inspect();
