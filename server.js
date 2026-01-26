const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const { auth } = require('./middleware/auth');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./utils/swagger');

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Middleware
const corsOptions = {
  origin: [
    'https://transformer-backend-r4b5.onrender.com',
    'https://transformer-frontend-six.vercel.app',
    'https://bhimcharan.duckdns.org',
    'http://localhost:5173',
    'http://localhost:5000'
  ]
};
app.use(cors(corsOptions));
app.set('trust proxy', 1);
app.use(express.json());

// Swagger UI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/uploads', express.static('uploads'));

// Routes
const authRoutes = require('./routes/auth');
const consigneeRoutes = require('./routes/consignees');
const deliveryScheduleRoutes = require('./routes/deliverySchedules');
const transformerRoutes = require('./routes/transformers');
const deliveryChallanRoutes = require('./routes/deliveryChallans');
const gpFailureRoutes = require('./routes/gpFailures');
const failureAnalysisRoutes = require('./routes/failureAnalyses');
const gpReceiptNoteRoutes = require('./routes/gpReceiptNotes');
const tnRoutes = require('./routes/tns');
const newGPInformationRoutes = require('./routes/newGPInformations');
const userRoutes = require('./routes/users');
const companyRoutes = require('./routes/companies');
const supplyTenderRoutes = require('./routes/supplyTenders');
const loaRoutes = require('./routes/loa');
const deffermentRoutes = require('./routes/defferment');
const finalInspectionRoutes = require('./routes/finalInspection');
const deliveryDetailsRoutes = require('./routes/deliveryDetails');
const materialDescriptionRoutes = require('./routes/materialDescription');
const chalanDescriptionRoutes = require('./routes/chalanDescription');
const damagedTransformerRoutes = require('./routes/damagedTransformer');
const newGPReceiptRecordRoutes = require('./routes/newGPReceiptRecord');
const misReportsRoutes = require('./routes/misReports');
const activityLogsRoutes = require('./routes/activityLogs'); // New: Activity Logs Router

app.use('/api/auth', authRoutes);
app.use('/api/consignees', consigneeRoutes);
app.use('/api/delivery-schedules', deliveryScheduleRoutes);
app.use('/api/transformers', transformerRoutes);
app.use('/api/delivery-challans', deliveryChallanRoutes);
app.use('/api/gp-failures', gpFailureRoutes);
app.use('/api/failure-analyses', failureAnalysisRoutes);
app.use('/api/gp-receipt-notes', gpReceiptNoteRoutes);
app.use('/api/tns', tnRoutes);
app.use('/api/new-gp-informations', newGPInformationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/supply-tenders', supplyTenderRoutes);
app.use('/api/loas', loaRoutes);
app.use('/api/defferments', deffermentRoutes);
app.use('/api/final-inspections', finalInspectionRoutes);
app.use('/api/delivery-details', deliveryDetailsRoutes);
app.use('/api/material-descriptions', materialDescriptionRoutes);
app.use('/api/chalan-descriptions', chalanDescriptionRoutes);
app.use('/api/damaged-transformers', damagedTransformerRoutes);
app.use('/api/new-gp-receipt-records', newGPReceiptRecordRoutes);
app.use('/api/mis-reports', misReportsRoutes);
app.use('/api/activity-logs', activityLogsRoutes); // New: Activity Logs Route Integration

const { logError } = require('./utils/errorLogger');

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Transformer Backend API is running' });
});

// // Error handling middleware
// app.use((err, req, res, next) => {
//   logError(err);
//   console.log("sample")
//   console.error(err);
//   console.error(err.stack);
//   const statusCode = err.status || err.statusCode || 500;
//    res.status(statusCode).json({
//     success: false,
//     message: err.message || "An unexpected error occurred",
//     ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
//   });
// });


// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
