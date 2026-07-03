require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Models
const { createCustomersTable } = require('./models/customer');
const { createAppointmentsTable } = require('./models/appointment');
const { createFollowupsTable } = require('./models/followup');
const { createOrdersTable } = require('./models/order');
const { createQuotationsTable } = require('./models/quotation');
const { createProductionTable } = require('./models/production');
const { createTrialsTable } = require('./models/trial');
const { createDeliveriesTable } = require('./models/delivery');
const { createMeasurementTemplatesTable } = require('./models/measurementTemplate');
const { createMeasurementHistoryTable } = require('./models/measurementHistory');
const { initInventoryDB } = require('./models/inventory');
const { createInvoicesTable } = require('./models/invoice');
const { createPaymentsTable } = require('./models/payment');
const { createEmployeesTable } = require('./models/employee');
const { createAttendanceTable } = require('./models/attendance');
const { createEmailLogsTable } = require('./models/emailLog');
const { createLeadsTable } = require('./models/lead');
const { createUsersTable } = require('./models/user');
const { createSubscriptionsTable } = require('./models/subscription');
const createSettingsTable = require('./models/settings');
const { createBoutiquesTable } = require('./models/boutique');

// Routes
const customerRoutes = require('./routes/customerRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const followupRoutes = require('./routes/followupRoutes');
const orderRoutes = require('./routes/orderRoutes');
const quotationRoutes = require('./routes/quotationRoutes');
const productionRoutes = require('./routes/productionRoutes');
const trialRoutes = require('./routes/trialRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const measurementTemplateRoutes = require('./routes/measurementTemplateRoutes');
const measurementHistoryRoutes = require('./routes/measurementHistoryRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const billingRoutes = require('./routes/billingRoutes');
const reportRoutes = require('./routes/reportRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const emailRoutes = require('./routes/emailRoutes');
const leadRoutes = require('./routes/leadRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const authRoutes = require('./routes/authRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Database Tables
const initDB = async () => {
  await createBoutiquesTable(); // Must be first — others reference it
  await createUsersTable();
  await createCustomersTable();
  await createAppointmentsTable();
  await createFollowupsTable();
  await createOrdersTable();
  await createQuotationsTable();
  await createProductionTable();
  await createTrialsTable();
  await createDeliveriesTable();
  await createMeasurementTemplatesTable();
  await createMeasurementHistoryTable();
  await initInventoryDB();
  await createInvoicesTable();
  await createPaymentsTable();
  await createEmployeesTable();
  await createAttendanceTable();
  await createEmailLogsTable();
  await createLeadsTable();
  await createSubscriptionsTable();
  await createSettingsTable();
};
initDB();

// Routes
app.use('/api/customers', customerRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/followups', followupRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/trials', trialRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/measurement-templates', measurementTemplateRoutes);
app.use('/api/measurement-history', measurementHistoryRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);

// Basic route
app.get('/', (req, res) => {
  res.send('Boutique CRM API is running...');
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
