require('dotenv').config(); 

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const leadRoutes = require('./routes/leadRoutes');
const productRoutes = require('./routes/productRoutes');
const projectRoutes = require('./routes/projectRoutes');
const customerRoutes = require('./routes/customerRoutes');
const reportRoutes = require('./routes/reportRoutes');
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Smart CRM API is running.', timestamp: new Date() });
});

app.use('/api/auth',      authRoutes);
app.use('/api/leads',     leadRoutes);
app.use('/api/products',  productRoutes);
app.use('/api/projects',  projectRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/reports',   reportRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\n🚀 Smart CRM Backend running on port ${PORT}`);
  console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
