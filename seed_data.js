const pool = require('./config/db');

async function seed() {
  try {
    console.log('Starting database seeding...');

    // 1. Seed Suppliers
    const supplierCount = await pool.query('SELECT COUNT(*) FROM suppliers');
    if (parseInt(supplierCount.rows[0].count, 10) === 0) {
      await pool.query(`
        INSERT INTO suppliers (name, contact, email, phone, location, category, rating) VALUES
        ('Varanasi Weaves', 'Rajesh Kumar', 'varanasi.weaves@example.com', '+91 99887 76655', 'Varanasi, UP', 'Silk Fabrics', 5),
        ('Surat Cotton Mills', 'Amit Shah', 'surat.cotton@example.com', '+91 98765 43210', 'Surat, Gujarat', 'Cotton & Blends', 4),
        ('Delhi Trim & Zipper Depot', 'Vijay Malhotra', 'delhi.trim@example.com', '+91 95551 12233', 'Chandni Chowk, Delhi', 'Accessories', 4)
      `);
      console.log('Seeded suppliers');
    }

    // 2. Seed Inventory Items
    const itemCount = await pool.query('SELECT COUNT(*) FROM inventory_items');
    if (parseInt(itemCount.rows[0].count, 10) === 0) {
      await pool.query(`
        INSERT INTO inventory_items (code, name, type, color, stock, min_stock, price, unit) VALUES
        ('FAB-001', 'Banarasi Silk Brocade', 'Fabric', 'Gold', 35.00, 10.00, 1200.00, 'meters'),
        ('FAB-002', 'Organic Raw Cotton', 'Fabric', 'Off-White', 8.00, 15.00, 350.00, 'meters'), -- Low stock
        ('FAB-003', 'Raw Banarasi Silk', 'Fabric', 'Red', 12.00, 15.00, 1500.00, 'meters'), -- Low stock
        ('FAB-004', 'Embroidered Organza', 'Fabric', 'Pink', 8.00, 10.00, 600.00, 'meters'), -- Low stock
        ('ACC-001', 'Invisible Zipper 20cm', 'Accessory', 'Black', 25.00, 40.00, 25.00, 'pcs'), -- Low stock
        ('ACC-002', 'Designer Zari Lace', 'Accessory', 'Gold', 100.00, 20.00, 150.00, 'meters'),
        ('ACC-003', 'Premium Brass Buttons', 'Accessory', 'Brass', 150.00, 50.00, 10.00, 'pcs')
      `);
      console.log('Seeded inventory items');
    }

    // 3. Seed Customers
    const customerCount = await pool.query('SELECT COUNT(*) FROM customers');
    let PriyankaId, AnjaliId, SanjanaId, RohanId;
    if (parseInt(customerCount.rows[0].count, 10) === 0) {
      const p = await pool.query("INSERT INTO customers (name, email, phone, address) VALUES ('Priyanka Sen', 'priyansen92@example.com', '+91 98123 45678', 'Salt Lake, Kolkata') RETURNING id");
      const a = await pool.query("INSERT INTO customers (name, email, phone, address) VALUES ('Anjali Sharma', 'anjali.sharma@example.com', '+91 98765 43210', 'South Ext, Delhi') RETURNING id");
      const s = await pool.query("INSERT INTO customers (name, email, phone, address) VALUES ('Sanjana Roy', 'sanjana.roy@example.com', '+91 95551 12233', 'Andheri West, Mumbai') RETURNING id");
      const r = await pool.query("INSERT INTO customers (name, email, phone, address) VALUES ('Rohan Mehra', 'rohan.mehra@example.com', '+91 91234 56789', 'Connaught Place, Delhi') RETURNING id");
      
      PriyankaId = p.rows[0].id;
      AnjaliId = a.rows[0].id;
      SanjanaId = s.rows[0].id;
      RohanId = r.rows[0].id;

      console.log('Seeded customers');
    } else {
      const p = await pool.query("SELECT id FROM customers WHERE name = 'Priyanka Sen' LIMIT 1");
      const a = await pool.query("SELECT id FROM customers WHERE name = 'Anjali Sharma' LIMIT 1");
      const s = await pool.query("SELECT id FROM customers WHERE name = 'Sanjana Roy' LIMIT 1");
      const r = await pool.query("SELECT id FROM customers WHERE name = 'Rohan Mehra' LIMIT 1");
      
      PriyankaId = p.rows[0]?.id;
      AnjaliId = a.rows[0]?.id;
      SanjanaId = s.rows[0]?.id;
      RohanId = r.rows[0]?.id;
    }

    // 4. Seed Orders
    const orderCount = await pool.query('SELECT COUNT(*) FROM orders');
    let ord1, ord2, ord3, ord4;
    if (parseInt(orderCount.rows[0].count, 10) === 0) {
      const o1 = await pool.query(`
        INSERT INTO orders (customer_name, category, stitching_cost, total_amount, advance_paid, delivery_date, order_date, tailor, fabric_details, priority, status) VALUES
        ('Priyanka Sen', 'Lehenga', 15000.00, 85000.00, 85000.00, CURRENT_DATE + INTERVAL '10 days', CURRENT_DATE - INTERVAL '5 days', 'Sunil Kumar', 'Gold Brocade Silk fabric', 'High', 'Trial Scheduled')
        RETURNING id
      `);
      const o2 = await pool.query(`
        INSERT INTO orders (customer_name, category, stitching_cost, total_amount, advance_paid, delivery_date, order_date, tailor, fabric_details, priority, status) VALUES
        ('Anjali Sharma', 'Suit', 5000.00, 62000.00, 62000.00, CURRENT_DATE + INTERVAL '15 days', CURRENT_DATE - INTERVAL '4 days', 'Suresh Prasad', 'Raw Silk fabric with Zari trims', 'Normal', 'Received')
        RETURNING id
      `);
      const o3 = await pool.query(`
        INSERT INTO orders (customer_name, category, stitching_cost, total_amount, advance_paid, delivery_date, order_date, tailor, fabric_details, priority, status) VALUES
        ('Sanjana Roy', 'Saree Blouse', 3000.00, 48000.00, 48000.00, CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE - INTERVAL '10 days', 'Sunil Kumar', 'Pink Velvet fabric', 'High', 'In Production')
        RETURNING id
      `);
      const o4 = await pool.query(`
        INSERT INTO orders (customer_name, category, stitching_cost, total_amount, advance_paid, delivery_date, order_date, tailor, fabric_details, priority, status) VALUES
        ('Rohan Mehra', 'Sherwani', 12000.00, 35000.00, 35000.00, CURRENT_DATE + INTERVAL '20 days', CURRENT_DATE - INTERVAL '8 days', 'Suresh Prasad', 'Premium Raw Banarasi Silk', 'Normal', 'Received')
        RETURNING id
      `);

      ord1 = o1.rows[0].id;
      ord2 = o2.rows[0].id;
      ord3 = o3.rows[0].id;
      ord4 = o4.rows[0].id;
      console.log('Seeded orders');
    } else {
      const o1 = await pool.query("SELECT id FROM orders WHERE customer_name = 'Priyanka Sen' LIMIT 1");
      const o2 = await pool.query("SELECT id FROM orders WHERE customer_name = 'Anjali Sharma' LIMIT 1");
      const o3 = await pool.query("SELECT id FROM orders WHERE customer_name = 'Sanjana Roy' LIMIT 1");
      const o4 = await pool.query("SELECT id FROM orders WHERE customer_name = 'Rohan Mehra' LIMIT 1");

      ord1 = o1.rows[0]?.id;
      ord2 = o2.rows[0]?.id;
      ord3 = o3.rows[0]?.id;
      ord4 = o4.rows[0]?.id;
    }

    // 5. Seed Invoices & Payments (to populate Finance metrics)
    const invoiceCount = await pool.query('SELECT COUNT(*) FROM invoices');
    if (parseInt(invoiceCount.rows[0].count, 10) <= 1) { // 1 is sample
      await pool.query('DELETE FROM payments');
      await pool.query('DELETE FROM invoices');

      const inv1 = await pool.query(`
        INSERT INTO invoices (invoice_number, order_id, customer_name, invoice_date, due_date, total_amount, status, items) VALUES
        ('INV-2026-001', ${ord1 || 'null'}, 'Priyanka Sen', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '5 days', 85000.00, 'Paid', '[{"description":"Designer Silk Lehenga","quantity":1,"price":85000,"amount":85000}]')
        RETURNING id
      `);
      const inv2 = await pool.query(`
        INSERT INTO invoices (invoice_number, order_id, customer_name, invoice_date, due_date, total_amount, status, items) VALUES
        ('INV-2026-002', ${ord2 || 'null'}, 'Anjali Sharma', CURRENT_DATE - INTERVAL '4 days', CURRENT_DATE + INTERVAL '10 days', 62000.00, 'Paid', '[{"description":"Salwar Suit with Lace","quantity":1,"price":62000,"amount":62000}]')
        RETURNING id
      `);
      const inv3 = await pool.query(`
        INSERT INTO invoices (invoice_number, order_id, customer_name, invoice_date, due_date, total_amount, status, items) VALUES
        ('INV-2026-003', ${ord3 || 'null'}, 'Sanjana Roy', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '2 days', 48000.00, 'Paid', '[{"description":"Saree Blouse designer","quantity":1,"price":48000,"amount":48000}]')
        RETURNING id
      `);
      const inv4 = await pool.query(`
        INSERT INTO invoices (invoice_number, order_id, customer_name, invoice_date, due_date, total_amount, status, items) VALUES
        ('INV-2026-004', ${ord4 || 'null'}, 'Rohan Mehra', CURRENT_DATE - INTERVAL '8 days', CURRENT_DATE + INTERVAL '12 days', 35000.00, 'Paid', '[{"description":"Wedding Sherwani","quantity":1,"price":35000,"amount":35000}]')
        RETURNING id
      `);
      const inv5 = await pool.query(`
        INSERT INTO invoices (invoice_number, order_id, customer_name, invoice_date, due_date, total_amount, status, items) VALUES
        ('INV-2026-005', null, 'Meera Nair', CURRENT_DATE - INTERVAL '1 days', CURRENT_DATE + INTERVAL '6 days', 125000.00, 'Pending', '[{"description":"Premium Bridal Lehenga","quantity":1,"price":125000,"amount":125000}]')
        RETURNING id
      `);

      // Seed payments (total = 85000 + 62000 + 48000 + 35000 = 230,000)
      await pool.query(`
        INSERT INTO payments (receipt_number, invoice_id, customer_name, amount, method, payment_date, note) VALUES
        ('PAY-001', ${inv1.rows[0].id}, 'Priyanka Sen', 85000.00, 'UPI', CURRENT_DATE - INTERVAL '5 days', 'Full Payment'),
        ('PAY-002', ${inv2.rows[0].id}, 'Anjali Sharma', 62000.00, 'Cash', CURRENT_DATE - INTERVAL '4 days', 'Full Payment'),
        ('PAY-003', ${inv3.rows[0].id}, 'Sanjana Roy', 48000.00, 'UPI', CURRENT_DATE - INTERVAL '10 days', 'Full Payment'),
        ('PAY-004', ${inv4.rows[0].id}, 'Rohan Mehra', 35000.00, 'Card', CURRENT_DATE - INTERVAL '8 days', 'Full Payment')
      `);
      console.log('Seeded invoices and payments');
    }

    // 6. Seed Purchases (Expenses)
    const purchaseCount = await pool.query('SELECT COUNT(*) FROM purchases');
    if (parseInt(purchaseCount.rows[0].count, 10) === 0) {
      await pool.query(`
        INSERT INTO purchases (po_number, supplier, items, total_amount, date, status) VALUES
        ('PO-2026-001', 'Varanasi Weaves', 'Banarasi Silk Brocade x 30m', 36000.00, CURRENT_DATE - INTERVAL '20 days', 'Received'),
        ('PO-2026-002', 'Surat Cotton Mills', 'Organic Raw Cotton x 50m', 17500.00, CURRENT_DATE - INTERVAL '10 days', 'Received'),
        ('PO-2026-003', 'Delhi Trim & Zipper Depot', 'Invisible Zippers x 100, Designer Zari Lace x 50m', 10000.00, CURRENT_DATE - INTERVAL '2 days', 'Ordered')
      `);
      console.log('Seeded purchase orders (expenses)');
    }

    // 7. Seed Stock Ledger
    const ledgerCount = await pool.query('SELECT COUNT(*) FROM stock_ledger');
    if (parseInt(ledgerCount.rows[0].count, 10) === 0) {
      await pool.query(`
        INSERT INTO stock_ledger (item_name, item_code, type, quantity, unit, reason, updated_by, date) VALUES
        ('Banarasi Silk Brocade', 'FAB-001', 'Stock In', 35.00, 'meters', 'Initial stock purchase from Varanasi Weaves', 'Admin', CURRENT_DATE - INTERVAL '20 days'),
        ('Organic Raw Cotton', 'FAB-002', 'Stock In', 50.00, 'meters', 'Initial stock purchase from Surat Cotton Mills', 'Admin', CURRENT_DATE - INTERVAL '10 days'),
        ('Organic Raw Cotton', 'FAB-002', 'Stock Out', 42.00, 'meters', 'Deducted for confirmed orders stitching', 'Tailor Sunil', CURRENT_DATE - INTERVAL '3 days')
      `);
      console.log('Seeded stock ledger');
    }

    console.log('Seeding completed successfully!');
  } catch (err) {
    console.error('Seeding failed:', err.message);
  }
  process.exit(0);
}

seed();
