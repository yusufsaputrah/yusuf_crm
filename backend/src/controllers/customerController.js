const { query } = require('../config/database');

const getAllCustomers = async (req, res, next) => {
  try {
    const { role, id: salesId } = req.user;
    const params = [];
    const conditions = ['c.is_active = TRUE'];

    if (role === 'sales') {
      params.push(salesId);
      conditions.push(`c.sales_id = $${params.length}`);
    }

    const result = await query(`
      SELECT
        c.id, c.full_name, c.phone, c.email, c.address, c.gender,
        c.joined_at, c.is_active,
        u.full_name AS sales_name,
        COUNT(cs.id) AS service_count,
        COALESCE(SUM(cs.negotiated_price * cs.quantity), 0) AS monthly_value
      FROM customers c
      JOIN users u ON c.sales_id = u.id
      LEFT JOIN customer_services cs ON cs.customer_id = c.id AND cs.is_active = TRUE
      WHERE ${conditions.join(' AND ')}
      GROUP BY c.id, u.full_name
      ORDER BY c.joined_at DESC
    `, params);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

const getCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, id: salesId } = req.user;

    const ownerFilter = role === 'sales' ? 'AND c.sales_id = $2' : '';
    const params = role === 'sales' ? [id, salesId] : [id];

    const customerResult = await query(`
      SELECT c.*, u.full_name AS sales_name
      FROM customers c
      JOIN users u ON c.sales_id = u.id
      WHERE c.id = $1 ${ownerFilter}
    `, params);

    if (!customerResult.rows[0]) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    const servicesResult = await query(`
      SELECT cs.id, cs.quantity, cs.negotiated_price, cs.start_date, cs.is_active,
             p.product_name, p.selling_price
      FROM customer_services cs
      JOIN products p ON cs.product_id = p.id
      WHERE cs.customer_id = $1
      ORDER BY cs.start_date DESC
    `, [id]);

    res.json({
      success: true,
      data: { ...customerResult.rows[0], services: servicesResult.rows },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllCustomers, getCustomerById };
