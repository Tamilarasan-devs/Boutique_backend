const pool = require('../config/db');

const getSalesReport = async (req, res) => {
  const boutique_id = req.user.boutique_id;
  try {
    // Total revenue: sum of payments
    const revRes = await pool.query('SELECT SUM(amount) FROM payments WHERE boutique_id = $1', [boutique_id]);
    const totalRevenue = parseFloat(revRes.rows[0].sum || 0);

    // Total orders: count of orders
    const orderCountRes = await pool.query('SELECT COUNT(*) FROM orders WHERE boutique_id = $1', [boutique_id]);
    const totalOrders = parseInt(orderCountRes.rows[0].count, 10);

    // Average order value
    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // Top customers
    // Group by customer_name and sum amount in payments
    const topCustRes = await pool.query(
      `SELECT customer_name as name, SUM(amount)::numeric as spend, COUNT(*)::integer as orders 
       FROM payments 
       WHERE boutique_id = $1
       GROUP BY customer_name 
       ORDER BY spend DESC 
       LIMIT 5`, [boutique_id]
    );
    const topCustomers = topCustRes.rows.map(row => ({
      name: row.name,
      spend: parseFloat(row.spend || 0),
      orders: row.orders
    }));

    // Chart data: daily payments for the last 7 days
    const chartRes = await pool.query(
      `SELECT to_char(payment_date, 'Dy') as label, SUM(amount)::numeric as value 
       FROM payments 
       WHERE payment_date >= CURRENT_DATE - INTERVAL '7 days' AND boutique_id = $1
       GROUP BY to_char(payment_date, 'Dy'), date_trunc('day', payment_date)
       ORDER BY date_trunc('day', payment_date) ASC`, [boutique_id]
    );

    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const chartDataMap = {};
    chartRes.rows.forEach(r => {
      chartDataMap[r.label] = parseFloat(r.value || 0);
    });
    
    const chartData = daysOfWeek.map(day => ({
      label: day,
      value: chartDataMap[day] || 0
    }));

    res.status(200).json({
      totalRevenue,
      totalOrders,
      averageOrderValue,
      topCustomers,
      chartData
    });
  } catch (error) {
    console.error('Error fetching sales report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getInventoryReport = async (req, res) => {
  const boutique_id = req.user.boutique_id;
  try {
    const totalItemsRes = await pool.query('SELECT COUNT(*) FROM inventory_items WHERE boutique_id = $1', [boutique_id]);
    const totalItems = parseInt(totalItemsRes.rows[0].count, 10);

    const lowStockItemsRes = await pool.query('SELECT name, stock::numeric, unit, min_stock as min FROM inventory_items WHERE stock <= min_stock AND boutique_id = $1', [boutique_id]);
    const lowStockItems = lowStockItemsRes.rows.map(r => ({
      name: r.name,
      stock: parseFloat(r.stock || 0),
      unit: r.unit,
      min: parseFloat(r.min || 0)
    }));

    const totalValueRes = await pool.query('SELECT SUM(stock * price) FROM inventory_items WHERE boutique_id = $1', [boutique_id]);
    const totalValue = parseFloat(totalValueRes.rows[0].sum || 0);

    const breakdownRes = await pool.query(
      `SELECT type as category, COUNT(*)::integer as count, SUM(stock * price)::numeric as value 
       FROM inventory_items 
       WHERE boutique_id = $1
       GROUP BY type`, [boutique_id]
    );
    
    const categoryBreakdown = breakdownRes.rows.map(r => {
      const val = parseFloat(r.value || 0);
      const pct = totalValue > 0 ? Math.round((val / totalValue) * 100) : 0;
      return {
        category: r.category === 'Fabric' ? 'Silk Fabrics & Materials' : 'Accessories & Zippers',
        count: r.count,
        value: val,
        pct: pct
      };
    });

    res.status(200).json({
      totalItems,
      lowStockItems,
      totalValue,
      categoryBreakdown
    });
  } catch (error) {
    console.error('Error fetching inventory report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getFinanceReport = async (req, res) => {
  const boutique_id = req.user.boutique_id;
  try {
    const revRes = await pool.query('SELECT SUM(amount) FROM payments WHERE boutique_id = $1', [boutique_id]);
    const totalRevenue = parseFloat(revRes.rows[0].sum || 0);

    const expRes = await pool.query('SELECT SUM(total_amount) FROM purchases WHERE boutique_id = $1', [boutique_id]);
    const totalExpenses = parseFloat(expRes.rows[0].sum || 0);

    const grossProfit = totalRevenue - totalExpenses;
    const netProfit = grossProfit;

    const recRes = await pool.query("SELECT SUM(total_amount) FROM invoices WHERE status IN ('Pending', 'Overdue') AND boutique_id = $1", [boutique_id]);
    const pendingReceivables = parseFloat(recRes.rows[0].sum || 0);

    const monthlyRevRes = await pool.query(
      `SELECT to_char(payment_date, 'Mon') as label, SUM(amount)::numeric as revenue 
       FROM payments 
       WHERE payment_date >= CURRENT_DATE - INTERVAL '6 months' AND boutique_id = $1
       GROUP BY to_char(payment_date, 'Mon'), date_trunc('month', payment_date)
       ORDER BY date_trunc('month', payment_date) ASC`, [boutique_id]
    );

    const monthlyExpRes = await pool.query(
      `SELECT to_char(date, 'Mon') as label, SUM(total_amount)::numeric as expenses 
       FROM purchases 
       WHERE date >= CURRENT_DATE - INTERVAL '6 months' AND boutique_id = $1
       GROUP BY to_char(date, 'Mon'), date_trunc('month', date)
       ORDER BY date_trunc('month', date) ASC`, [boutique_id]
    );

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const activeLabels = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      activeLabels.push(months[d.getMonth()]);
    }

    const revMap = {};
    monthlyRevRes.rows.forEach(r => { revMap[r.label] = parseFloat(r.revenue || 0); });

    const expMap = {};
    monthlyExpRes.rows.forEach(r => { expMap[r.label] = parseFloat(r.expenses || 0); });

    const chartData = activeLabels.map(label => ({
      label,
      revenue: revMap[label] || 0,
      expenses: expMap[label] || 0
    }));

    res.status(200).json({
      totalRevenue,
      totalExpenses,
      grossProfit,
      netProfit,
      pendingReceivables,
      chartData
    });
  } catch (error) {
    console.error('Error fetching finance report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getCustomersReport = async (req, res) => {
  const boutique_id = req.user.boutique_id;
  try {
    const query = `
      SELECT c.name,
             COUNT(DISTINCT o.id)::integer as orders,
             COALESCE(SUM(p.amount), 0)::numeric as total_spend,
             MAX(o.order_date) as last_order
      FROM customers c
      LEFT JOIN orders o ON o.customer_name = c.name AND o.boutique_id = c.boutique_id
      LEFT JOIN payments p ON p.customer_name = c.name AND p.boutique_id = c.boutique_id
      WHERE c.boutique_id = $1
      GROUP BY c.id, c.name
      ORDER BY total_spend DESC
    `;
    const result = await pool.query(query, [boutique_id]);

    const customers = result.rows.map(r => {
      const totalSpend = parseFloat(r.total_spend || 0);
      const orders = r.orders;
      const avgOrder = orders > 0 ? Math.round(totalSpend / orders) : 0;
      
      let loyalty = 'New';
      if (totalSpend >= 50000) {
        loyalty = 'Gold';
      } else if (totalSpend >= 20000) {
        loyalty = 'Silver';
      } else if (totalSpend > 0) {
        loyalty = 'Regular';
      }

      return {
        name: r.name,
        orders,
        totalSpend,
        avgOrder,
        loyalty,
        lastOrder: r.last_order ? r.last_order.toISOString().substring(0, 10) : 'N/A'
      };
    });

    const totalCustomers = customers.length;
    const totalRevenue = customers.reduce((s, c) => s + c.totalSpend, 0);
    const totalOrders = customers.reduce((s, c) => s + c.orders, 0);

    res.status(200).json({
      totalCustomers,
      totalRevenue,
      totalOrders,
      customers
    });
  } catch (error) {
    console.error('Error fetching customers report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const exportReport = async (req, res) => {
  const { type } = req.params;
  const boutique_id = req.user.boutique_id;

  try {
    let csvContent = '';
    let filename = `report_${type}_${new Date().toISOString().substring(0, 10)}.csv`;

    if (type === 'sales') {
      const result = await pool.query('SELECT * FROM payments WHERE boutique_id = $1 ORDER BY payment_date DESC', [boutique_id]);
      csvContent = 'Receipt Number,Customer Name,Invoice ID,Amount,Method,Payment Date,Note\n';
      result.rows.forEach(r => {
        csvContent += `"${r.receipt_number}","${r.customer_name}","${r.invoice_id}","${r.amount}","${r.method}","${r.payment_date ? r.payment_date.toISOString() : ''}","${r.note || ''}"\n`;
      });
    } else if (type === 'inventory') {
      const result = await pool.query('SELECT * FROM inventory_items WHERE boutique_id = $1 ORDER BY stock ASC', [boutique_id]);
      csvContent = 'Item Code,Item Name,Type,Color,Stock,Min Stock,Price,Unit\n';
      result.rows.forEach(r => {
        csvContent += `"${r.code}","${r.name}","${r.type}","${r.color}","${r.stock}","${r.min_stock}","${r.price}","${r.unit}"\n`;
      });
    } else if (type === 'finance') {
      const revRes = await pool.query('SELECT * FROM payments WHERE boutique_id = $1 ORDER BY payment_date DESC', [boutique_id]);
      const expRes = await pool.query('SELECT * FROM purchases WHERE boutique_id = $1 ORDER BY date DESC', [boutique_id]);
      csvContent = 'TYPE,REFERENCE,PARTY,AMOUNT,METHOD,DATE,STATUS/NOTE\n';
      revRes.rows.forEach(r => {
        csvContent += `"REVENUE","${r.receipt_number}","${r.customer_name}","${r.amount}","${r.method}","${r.payment_date ? r.payment_date.toISOString() : ''}","${r.note || ''}"\n`;
      });
      expRes.rows.forEach(r => {
        csvContent += `"EXPENSE","${r.po_number}","${r.supplier}","${r.total_amount}","Purchase","${r.date ? r.date.toISOString() : ''}","${r.status || ''}"\n`;
      });
    } else if (type === 'customers') {
      const result = await pool.query(
        `SELECT c.name, c.email, c.phone, c.address, 
                COUNT(DISTINCT o.id)::integer as orders, 
                COALESCE(SUM(p.amount), 0)::numeric as spend 
         FROM customers c 
         LEFT JOIN orders o ON o.customer_name = c.name AND o.boutique_id = c.boutique_id
         LEFT JOIN payments p ON p.customer_name = c.name AND p.boutique_id = c.boutique_id
         WHERE c.boutique_id = $1
         GROUP BY c.id, c.name, c.email, c.phone, c.address 
         ORDER BY spend DESC`, [boutique_id]
      );
      csvContent = 'Customer Name,Email,Phone,Address,Orders Count,Total Spend\n';
      result.rows.forEach(r => {
        csvContent += `"${r.name}","${r.email || ''}","${r.phone || ''}","${r.address || ''}","${r.orders}","${r.spend}"\n`;
      });
    } else {
      return res.status(400).json({ error: 'Invalid report type' });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('Error exporting report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getSalesReport,
  getInventoryReport,
  getFinanceReport,
  getCustomersReport,
  exportReport
};
