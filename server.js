const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const { auth } = require('./middleware/auth');

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

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

app.use('/api/auth', authRoutes);
app.use('/api/consignees', auth, consigneeRoutes);
app.use('/api/delivery-schedules', auth, deliveryScheduleRoutes);
app.use('/api/transformers', auth, transformerRoutes);
app.use('/api/delivery-challans', auth, deliveryChallanRoutes);
app.use('/api/gp-failures', auth, gpFailureRoutes);
app.use('/api/failure-analyses', auth, failureAnalysisRoutes);
app.use('/api/gp-receipt-notes', auth, gpReceiptNoteRoutes);
app.use('/api/tns', auth, tnRoutes);
app.use('/api/new-gp-informations', auth, newGPInformationRoutes);
app.use('/api/users', auth, userRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Transformer Backend API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

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
