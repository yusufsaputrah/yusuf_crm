/**
 * @file reportController.js
 * @description Generates reports with date filters and Excel export capability.
 */

const XLSX = require('xlsx');
const { query } = require('../config/database');

/**
 * GET /api/reports/summary?startDate=&endDate=
 */
const getSummaryReport = async (req, res, next) => {
  try {
    const { role, id: salesId } = req.user;
    const { startDate, endDate } = req.query;

    const params = [];
    const salesFilter = role === 'sales' ? `AND p.sales_id = $${params.push(salesId)}` : '';
    const dateStart = startDate || '2000-01-01';
    const dateEnd = endDate || new Date().toISOString().split('T')[0];

    params.push(dateStart);
    const startParam = params.length;
    params.push(dateEnd);
    const endParam = params.length;

    // Approved projects in period
    const projectsResult = await query(`
      SELECT
        p.id, p.project_name, p.status, p.created_at,
        l.full_name AS lead_name,
        u.full_name AS sales_name,
        COALESCE(SUM(pi.negotiated_price * pi.quantity), 0) AS total_value
      FROM projects p
      JOIN leads l ON p.lead_id = l.id
      JOIN users u ON p.sales_id = u.id
      LEFT JOIN project_items pi ON pi.project_id = p.id
      WHERE p.status = 'approved'
        AND p.created_at::date BETWEEN $${startParam} AND $${endParam}
        ${salesFilter}
      GROUP BY p.id, l.full_name, u.full_name
      ORDER BY p.created_at DESC
    `, params);

    // Leads summary
    const leadsResult = await query(`
      SELECT status, COUNT(*) AS count
      FROM leads
      WHERE created_at::date BETWEEN $1 AND $2
        ${role === 'sales' ? `AND sales_id = $3` : ''}
      GROUP BY status
    `, role === 'sales' ? [dateStart, dateEnd, salesId] : [dateStart, dateEnd]);

    const totalRevenue = projectsResult.rows.reduce((sum, r) => sum + parseFloat(r.total_value), 0);

    res.json({
      success: true,
      data: {
        period: { startDate: dateStart, endDate: dateEnd },
        totalRevenue,
        totalApprovedProjects: projectsResult.rows.length,
        projects: projectsResult.rows,
        leadsByStatus: leadsResult.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/export?startDate=&endDate=
 * Downloads an Excel file with report data.
 */
const exportReportToExcel = async (req, res, next) => {
  try {
    const { role, id: salesId } = req.user;
    const { startDate = '2000-01-01', endDate = new Date().toISOString().split('T')[0] } = req.query;

    const salesFilter = role === 'sales' ? `AND p.sales_id = $3` : '';
    const params = role === 'sales' ? [startDate, endDate, salesId] : [startDate, endDate];

    const projectsResult = await query(`
      SELECT
        p.project_name AS "Project Name",
        l.full_name AS "Lead Name",
        u.full_name AS "Sales",
        p.status AS "Status",
        COALESCE(SUM(pi.negotiated_price * pi.quantity), 0) AS "Total Value (IDR)",
        TO_CHAR(p.created_at, 'YYYY-MM-DD') AS "Created Date"
      FROM projects p
      JOIN leads l ON p.lead_id = l.id
      JOIN users u ON p.sales_id = u.id
      LEFT JOIN project_items pi ON pi.project_id = p.id
      WHERE p.status = 'approved'
        AND p.created_at::date BETWEEN $1 AND $2
        ${salesFilter}
      GROUP BY p.id, l.full_name, u.full_name
      ORDER BY p.created_at DESC
    `, params);

    const customersResult = await query(`
      SELECT
        c.full_name AS "Customer Name",
        c.phone AS "Phone",
        c.email AS "Email",
        u.full_name AS "Sales",
        p.product_name AS "Service",
        cs.negotiated_price AS "Price (IDR)",
        cs.quantity AS "Qty",
        TO_CHAR(cs.start_date, 'YYYY-MM-DD') AS "Start Date"
      FROM customers c
      JOIN users u ON c.sales_id = u.id
      JOIN customer_services cs ON cs.customer_id = c.id
      JOIN products p ON cs.product_id = p.id
      WHERE c.is_active = TRUE
        ${role === 'sales' ? 'AND c.sales_id = $1' : ''}
      ORDER BY c.joined_at DESC
    `, role === 'sales' ? [salesId] : []);

    const workbook = XLSX.utils.book_new();

    const projectSheet = XLSX.utils.json_to_sheet(projectsResult.rows);
    XLSX.utils.book_append_sheet(workbook, projectSheet, 'Approved Projects');

    const customerSheet = XLSX.utils.json_to_sheet(customersResult.rows);
    XLSX.utils.book_append_sheet(workbook, customerSheet, 'Active Customers');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const fileName = `CRM_Report_${startDate}_to_${endDate}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

module.exports = { getSummaryReport, exportReportToExcel };
