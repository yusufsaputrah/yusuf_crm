const express = require('express');
const { getSummaryReport, exportReportToExcel } = require('../controllers/reportController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/summary', getSummaryReport);
router.get('/export', exportReportToExcel);

module.exports = router;
