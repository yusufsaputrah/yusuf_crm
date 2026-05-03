/**
 * @file projectController.js
 * @description Deal pipeline / project management.
 * Handles lead-to-customer conversion with multi-product support,
 * negotiated pricing, and approval workflow.
 */

const { query, getClient } = require('../config/database');

/**
 * GET /api/projects
 */
const getAllProjects = async (req, res, next) => {
  try {
    const { role, id: salesId } = req.user;
    const { status } = req.query;

    const params = [];
    const conditions = ['1=1'];

    if (role === 'sales') {
      params.push(salesId);
      conditions.push(`p.sales_id = $${params.length}`);
    }

    if (status) {
      params.push(status);
      conditions.push(`p.status = $${params.length}`);
    }

    const result = await query(`
      SELECT
        p.id, p.project_name, p.status, p.needs_approval, p.notes,
        p.created_at, p.updated_at,
        l.full_name AS lead_name, l.phone AS lead_phone,
        u.full_name AS sales_name,
        approver.full_name AS approved_by_name,
        p.approved_at, p.rejection_reason,
        COALESCE(SUM(pi.negotiated_price * pi.quantity), 0) AS total_value
      FROM projects p
      JOIN leads l ON p.lead_id = l.id
      JOIN users u ON p.sales_id = u.id
      LEFT JOIN users approver ON p.approved_by = approver.id
      LEFT JOIN project_items pi ON pi.project_id = p.id
      WHERE ${conditions.join(' AND ')}
      GROUP BY p.id, l.full_name, l.phone, u.full_name, approver.full_name
      ORDER BY p.created_at DESC
    `, params);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/projects/:id
 */
const getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, id: salesId } = req.user;

    const ownerFilter = role === 'sales' ? 'AND p.sales_id = $2' : '';
    const params = role === 'sales' ? [id, salesId] : [id];

    const projectResult = await query(`
      SELECT p.*, l.full_name AS lead_name, u.full_name AS sales_name
      FROM projects p
      JOIN leads l ON p.lead_id = l.id
      JOIN users u ON p.sales_id = u.id
      WHERE p.id = $1 ${ownerFilter}
    `, params);

    if (!projectResult.rows[0]) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const itemsResult = await query(`
      SELECT pi.id, pi.quantity, pi.negotiated_price, pi.selling_price,
             pr.product_name, pr.base_cost, pr.margin_percent
      FROM project_items pi
      JOIN products pr ON pi.product_id = pr.id
      WHERE pi.project_id = $1
    `, [id]);

    res.json({
      success: true,
      data: { ...projectResult.rows[0], items: itemsResult.rows },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/projects
 * Creates a project with one or more product items.
 * Auto-sets needs_approval = TRUE if any item price is below selling_price.
 */
const createProject = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { projectName, leadId, notes, items } = req.body;
    const salesId = req.user.id;

    if (!projectName || !leadId || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'projectName, leadId, and at least one item are required.',
      });
    }

    // Validate lead ownership
    const leadCheck = await client.query(
      `SELECT id FROM leads WHERE id = $1 ${req.user.role === 'sales' ? 'AND sales_id = $2' : ''}`,
      req.user.role === 'sales' ? [leadId, salesId] : [leadId]
    );
    if (!leadCheck.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Lead not found or access denied.' });
    }

    // Validate all products and check if approval needed
    let needsApproval = false;
    const enrichedItems = [];

    for (const item of items) {
      const productResult = await client.query(
        'SELECT id, selling_price FROM products WHERE id = $1 AND is_active = TRUE',
        [item.productId]
      );
      const product = productResult.rows[0];
      if (!product) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: `Product ID ${item.productId} not found.` });
      }

      if (parseFloat(item.negotiatedPrice) < parseFloat(product.selling_price)) {
        needsApproval = true;
      }

      enrichedItems.push({ ...item, sellingPrice: product.selling_price });
    }

    const projectStatus = needsApproval ? 'waiting_approval' : 'approved';

    const projectResult = await client.query(`
      INSERT INTO projects (project_name, lead_id, sales_id, status, notes, needs_approval)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [projectName, leadId, salesId, projectStatus, notes, needsApproval]);

    const project = projectResult.rows[0];

    // Insert items
    for (const item of enrichedItems) {
      await client.query(`
        INSERT INTO project_items (project_id, product_id, quantity, negotiated_price, selling_price)
        VALUES ($1, $2, $3, $4, $5)
      `, [project.id, item.productId, item.quantity || 1, item.negotiatedPrice, item.sellingPrice]);
    }

    // Update lead status to 'qualified'
    await client.query(
      `UPDATE leads SET status = 'qualified', updated_at = NOW() WHERE id = $1`,
      [leadId]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: needsApproval
        ? 'Project created. Awaiting manager approval (negotiated price below selling price).'
        : 'Project created and auto-approved.',
      data: project,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

/**
 * PATCH /api/projects/:id/approve  [Manager only]
 */
const approveProject = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { action, rejectionReason } = req.body; // action: 'approve' | 'reject'
    const managerId = req.user.id;

    const projectResult = await client.query(
      `SELECT * FROM projects WHERE id = $1 AND status = 'waiting_approval'`,
      [id]
    );

    if (!projectResult.rows[0]) {
      return res.status(404).json({ success: false, message: 'Project not found or not pending approval.' });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    const updated = await client.query(`
      UPDATE projects
      SET status = $1, approved_by = $2, approved_at = NOW(),
          rejection_reason = $3, updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `, [newStatus, managerId, rejectionReason || null, id]);

    // If approved → convert lead to customer
    if (newStatus === 'approved') {
      const project = projectResult.rows[0];
      const lead = await client.query('SELECT * FROM leads WHERE id = $1', [project.lead_id]);
      const leadData = lead.rows[0];

      const customerResult = await client.query(`
        INSERT INTO customers (full_name, phone, email, address, lead_id, sales_id, project_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT DO NOTHING
        RETURNING *
      `, [leadData.full_name, leadData.phone, leadData.email, leadData.address, leadData.id, project.sales_id, project.id]);

      if (customerResult.rows[0]) {
        const customerId = customerResult.rows[0].id;
        const items = await client.query('SELECT * FROM project_items WHERE project_id = $1', [id]);

        for (const item of items.rows) {
          await client.query(`
            INSERT INTO customer_services (customer_id, product_id, negotiated_price, quantity)
            VALUES ($1, $2, $3, $4)
          `, [customerId, item.product_id, item.negotiated_price, item.quantity]);
        }

        // Update lead status to converted
        await client.query(
          `UPDATE leads SET status = 'converted', updated_at = NOW() WHERE id = $1`,
          [leadData.id]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ success: true, message: `Project ${newStatus}.`, data: updated.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

module.exports = { getAllProjects, getProjectById, createProject, approveProject };
