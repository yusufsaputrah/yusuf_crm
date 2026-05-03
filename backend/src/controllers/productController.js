/**
 * @file productController.js
 * @description CRUD for master product data (internet packages).
 * Only managers can create/update/delete products.
 */

const { query } = require('../config/database');

/**
 * GET /api/products
 */
const getAllProducts = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT id, product_name, description, base_cost, margin_percent, selling_price, is_active, created_at
      FROM products
      WHERE is_active = TRUE
      ORDER BY selling_price ASC
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/products/:id
 */
const getProductById = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/products  [Manager only]
 */
const createProduct = async (req, res, next) => {
  try {
    const { productName, description, baseCost, marginPercent } = req.body;

    if (!productName || baseCost === undefined || marginPercent === undefined) {
      return res.status(400).json({ success: false, message: 'productName, baseCost, and marginPercent are required.' });
    }

    const result = await query(`
      INSERT INTO products (product_name, description, base_cost, margin_percent)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [productName, description, baseCost, marginPercent]);

    res.status(201).json({ success: true, message: 'Product created.', data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/products/:id  [Manager only]
 */
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { productName, description, baseCost, marginPercent, isActive } = req.body;

    const existing = await query('SELECT id FROM products WHERE id = $1', [id]);
    if (!existing.rows[0]) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const result = await query(`
      UPDATE products
      SET product_name   = COALESCE($1, product_name),
          description    = COALESCE($2, description),
          base_cost      = COALESCE($3, base_cost),
          margin_percent = COALESCE($4, margin_percent),
          is_active      = COALESCE($5, is_active),
          updated_at     = NOW()
      WHERE id = $6
      RETURNING *
    `, [productName, description, baseCost, marginPercent, isActive, id]);

    res.json({ success: true, message: 'Product updated.', data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/products/:id  [Manager only — soft delete]
 */
const deleteProduct = async (req, res, next) => {
  try {
    const result = await query(
      'UPDATE products SET is_active = FALSE, updated_at = NOW() WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    res.json({ success: true, message: 'Product deactivated.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct };
