const express = require('express');
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { authenticate, authorizeManager } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.post('/', authorizeManager, createProduct);
router.put('/:id', authorizeManager, updateProduct);
router.delete('/:id', authorizeManager, deleteProduct);

module.exports = router;
