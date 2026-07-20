require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { verifyToken } = require('./middleware/auth');
const helmet = require('helmet');
const { authLimiter } = require('./middleware/rateLimiter');

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
const { createRolePermissionsTable } = require('./models/rolePermissions');
const { createSubscriptionsTable } = require('./models/subscription');
const createSettingsTable = require('./models/settings');
const { createBoutiquesTable } = require('./models/boutique');
const { runMigrations } = require('./models/migrate');

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
const campaignRoutes = require('./routes/campaignRoutes');
const leadRoutes = require('./routes/leadRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const authRoutes = require('./routes/authRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const productRoutes = require('./routes/productRoutes');
const posBillingRoutes = require('./routes/posBillingRoutes');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
const ALLOWED_ORIGINS = [
  'https://boutique-frontend-eta.vercel.app',
  'http://localhost:5173',
  'http://localhost:4173', // vite preview
  'http://localhost:5174',
  'https://crm-boutique.netlify.app'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. Postman, server-to-server)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
}));

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow Cloudinary images
  contentSecurityPolicy: false, // handled by frontend
}));

// Body size cap — prevents DOS via large payloads
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Initialize Database Tables
const initDB = async () => {
  await createBoutiquesTable(); // Must be first — others reference it
  await runMigrations();        // Patch any missing columns on existing prod DB
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
  // NOTE: createUsersTable already called above (line 87) — removed duplicate call
  await createRolePermissionsTable();
  await createSubscriptionsTable();
  await createSettingsTable();
};
initDB();

// Routes
app.use('/api/customers', verifyToken, customerRoutes);
app.use('/api/appointments', verifyToken, appointmentRoutes);
app.use('/api/followups', verifyToken, followupRoutes);
app.use('/api/orders', verifyToken, orderRoutes);
app.use('/api/quotations', verifyToken, quotationRoutes);
app.use('/api/production', verifyToken, productionRoutes);
app.use('/api/trials', verifyToken, trialRoutes);
app.use('/api/deliveries', verifyToken, deliveryRoutes);
app.use('/api/measurement-templates', verifyToken, measurementTemplateRoutes);
app.use('/api/measurement-history', verifyToken, measurementHistoryRoutes);
app.use('/api/inventory', verifyToken, inventoryRoutes);
app.use('/api/billing', verifyToken, billingRoutes);
app.use('/api/reports', verifyToken, reportRoutes);
app.use('/api/employees', verifyToken, employeeRoutes);
app.use('/api/attendance', verifyToken, attendanceRoutes);
app.use('/api/email', verifyToken, emailRoutes);
app.use('/api/campaigns', verifyToken, campaignRoutes);
app.use('/api/leads', verifyToken, leadRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/webhooks', webhookRoutes);
// Rate-limit auth endpoints before processing
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/settings', verifyToken, settingsRoutes);
app.use('/api/upload', verifyToken, uploadRoutes);
app.use('/api/products', verifyToken, productRoutes);
app.use('/api/pos-billing', posBillingRoutes);

// Health-check routes
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'Boutique CRM API' });
});
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── 404 handler — must be AFTER all routes ───────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// ─── Global error handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[GlobalError]', err.message, err.stack);
  // Don't leak internal error details to clients
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: status === 500 ? 'Internal server error.' : err.message });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
