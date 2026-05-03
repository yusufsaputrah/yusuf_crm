const express = require('express');
const { getAllCustomers, getCustomerById } = require('../controllers/customerController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/', getAllCustomers);
router.get('/:id', getCustomerById);

module.exports = router;
