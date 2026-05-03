/**
 * @file migrate.js
 * @description Database migration script. Creates all tables for the Smart CRM application.
 * Run with: npm run migrate
 */

require('dotenv').config();
const { pool } = require('../config/database');

const SQL_CREATE_TABLES = `
  -- ============================================================
  -- USERS TABLE
  -- ============================================================
  CREATE TABLE IF NOT EXISTS users (
    id          SERIAL PRIMARY KEY,
    full_name   VARCHAR(150) NOT NULL,
    email       VARCHAR(150) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,
    role        VARCHAR(20) NOT NULL CHECK (role IN ('sales', 'manager')),
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
  );

  -- ============================================================
  -- PRODUCTS TABLE (Master Data)
  -- ============================================================
  CREATE TABLE IF NOT EXISTS products (
    id               SERIAL PRIMARY KEY,
    product_name     VARCHAR(150) NOT NULL,
    description      TEXT,
    base_cost        NUMERIC(15, 2) NOT NULL,   -- HPP (Harga Pokok Penjualan)
    margin_percent   NUMERIC(5, 2) NOT NULL,    -- Margin Sales (%)
    selling_price    NUMERIC(15, 2) GENERATED ALWAYS AS (base_cost + (base_cost * margin_percent / 100)) STORED,
    is_active        BOOLEAN DEFAULT TRUE,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
  );

  -- ============================================================
  -- LEADS TABLE (Calon Customer)
  -- ============================================================
  CREATE TABLE IF NOT EXISTS leads (
    id            SERIAL PRIMARY KEY,
    full_name     VARCHAR(150) NOT NULL,
    phone         VARCHAR(30),
    email         VARCHAR(150),
    address       TEXT,
    requirements  TEXT,
    status        VARCHAR(30) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
    sales_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
  );

  -- ============================================================
  -- PROJECTS TABLE (Deal Pipeline)
  -- ============================================================
  CREATE TABLE IF NOT EXISTS projects (
    id                SERIAL PRIMARY KEY,
    project_name      VARCHAR(200) NOT NULL,
    lead_id           INTEGER NOT NULL REFERENCES leads(id) ON DELETE RESTRICT,
    sales_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status            VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'waiting_approval', 'approved', 'rejected')),
    notes             TEXT,
    needs_approval    BOOLEAN DEFAULT FALSE,   -- TRUE if any item price < selling_price
    approved_by       INTEGER REFERENCES users(id),
    approved_at       TIMESTAMPTZ,
    rejection_reason  TEXT,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
  );

  -- ============================================================
  -- PROJECT ITEMS TABLE (Products per Project)
  -- ============================================================
  CREATE TABLE IF NOT EXISTS project_items (
    id                SERIAL PRIMARY KEY,
    project_id        INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    product_id        INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity          INTEGER NOT NULL DEFAULT 1,
    negotiated_price  NUMERIC(15, 2) NOT NULL,  -- Harga yang disepakati
    selling_price     NUMERIC(15, 2) NOT NULL,  -- Snapshot harga jual saat transaksi
    created_at        TIMESTAMPTZ DEFAULT NOW()
  );

  -- ============================================================
  -- CUSTOMERS TABLE (Active Customers)
  -- ============================================================
  CREATE TABLE IF NOT EXISTS customers (
    id            SERIAL PRIMARY KEY,
    full_name     VARCHAR(150) NOT NULL,
    phone         VARCHAR(30),
    email         VARCHAR(150),
    address       TEXT,
    lead_id       INTEGER REFERENCES leads(id),
    sales_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    project_id    INTEGER REFERENCES projects(id),
    is_active     BOOLEAN DEFAULT TRUE,
    joined_at     TIMESTAMPTZ DEFAULT NOW(),
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
  );

  -- ============================================================
  -- CUSTOMER SERVICES TABLE (Layanan per Customer)
  -- ============================================================
  CREATE TABLE IF NOT EXISTS customer_services (
    id                SERIAL PRIMARY KEY,
    customer_id       INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    product_id        INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    negotiated_price  NUMERIC(15, 2) NOT NULL,
    quantity          INTEGER NOT NULL DEFAULT 1,
    start_date        DATE DEFAULT CURRENT_DATE,
    is_active         BOOLEAN DEFAULT TRUE,
    created_at        TIMESTAMPTZ DEFAULT NOW()
  );

  -- ============================================================
  -- INDEXES for performance
  -- ============================================================
  CREATE INDEX IF NOT EXISTS idx_leads_sales_id ON leads(sales_id);
  CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
  CREATE INDEX IF NOT EXISTS idx_projects_sales_id ON projects(sales_id);
  CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
  CREATE INDEX IF NOT EXISTS idx_customers_sales_id ON customers(sales_id);
  CREATE INDEX IF NOT EXISTS idx_project_items_project_id ON project_items(project_id);
`;

const runMigration = async () => {
  const client = await pool.connect();
  try {
    console.log('[Migration] Starting database migration...');
    await client.query(SQL_CREATE_TABLES);
    console.log('[Migration] ✅ All tables created successfully.');
  } catch (error) {
    console.error('[Migration] ❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

runMigration();
