const { query } = require('../config/database');

const buildOwnershipFilter = (role, salesId, paramOffset = 0) => {
  if (role === 'manager') return { clause: '', params: [] };
  return { clause: `AND l.sales_id = $${paramOffset + 1}`, params: [salesId] };
};

const getAllLeads = async (req, res, next) => {
  try {
    const { role, id: salesId } = req.user;
    const { status, search } = req.query;

    let conditions = ['1=1'];
    const params = [];

    if (role === 'sales') {
      params.push(salesId);
      conditions.push(`l.sales_id = $${params.length}`);
    }

    if (status) {
      params.push(status);
      conditions.push(`l.status = $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(l.full_name ILIKE $${params.length} OR l.phone ILIKE $${params.length} OR l.email ILIKE $${params.length})`);
    }

    const sql = `
      SELECT
        l.id, l.full_name, l.phone, l.email, l.address, l.gender,
        l.requirements, l.status, l.created_at, l.updated_at,
        u.full_name AS sales_name
      FROM leads l
      JOIN users u ON l.sales_id = u.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY l.created_at DESC
    `;

    const result = await query(sql, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

const getLeadById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, id: salesId } = req.user;

    const ownerFilter = role === 'sales' ? 'AND l.sales_id = $2' : '';
    const params = role === 'sales' ? [id, salesId] : [id];

    const result = await query(`
      SELECT l.*, u.full_name AS sales_name
      FROM leads l
      JOIN users u ON l.sales_id = u.id
      WHERE l.id = $1 ${ownerFilter}
    `, params);

    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'Lead not found.' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

const createLead = async (req, res, next) => {
  try {
    const { fullName, phone, email, address, gender, requirements, status = 'new' } = req.body;
    const salesId = req.user.id;

    if (!fullName) {
      return res.status(400).json({ success: false, message: 'Full name is required.' });
    }

    const result = await query(`
      INSERT INTO leads (full_name, phone, email, address, gender, requirements, status, sales_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [fullName, phone, email, address, gender, requirements, status, salesId]);

    res.status(201).json({ success: true, message: 'Lead created successfully.', data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

const updateLead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, id: salesId } = req.user;
    const { fullName, phone, email, address, gender, requirements, status } = req.body;

    const ownerFilter = role === 'sales' ? 'AND sales_id = $2' : '';
    const checkParams = role === 'sales' ? [id, salesId] : [id];
    const existing = await query(`SELECT id FROM leads WHERE id = $1 ${ownerFilter}`, checkParams);

    if (!existing.rows[0]) {
      return res.status(404).json({ success: false, message: 'Lead not found or access denied.' });
    }

    const result = await query(`
      UPDATE leads
      SET full_name = COALESCE($1, full_name),
          phone = COALESCE($2, phone),
          email = COALESCE($3, email),
          address = COALESCE($4, address),
          gender = COALESCE($5, gender),
          requirements = COALESCE($6, requirements),
          status = COALESCE($7, status),
          updated_at = NOW()
      WHERE id = $8
      RETURNING *
    `, [fullName, phone, email, address, gender, requirements, status, id]);

    res.json({ success: true, message: 'Lead updated successfully.', data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

const deleteLead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, id: salesId } = req.user;

    const ownerFilter = role === 'sales' ? 'AND sales_id = $2' : '';
    const params = role === 'sales' ? [id, salesId] : [id];

    const result = await query(`DELETE FROM leads WHERE id = $1 ${ownerFilter} RETURNING id`, params);

    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'Lead not found or access denied.' });
    }

    res.json({ success: true, message: 'Lead deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllLeads, getLeadById, createLead, updateLead, deleteLead };
