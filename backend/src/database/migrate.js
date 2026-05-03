require('dotenv').config();
const { pool } = require('../config/database');

const SQL_CREATE_TABLES = `
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

  CREATE TABLE IF NOT EXISTS products (
    id               SERIAL PRIMARY KEY,
    product_name     VARCHAR(150) NOT NULL,
    description      TEXT,
    base_cost        NUMERIC(15, 2) NOT NULL,
    margin_percent   NUMERIC(5, 2) NOT NULL,
    selling_price    NUMERIC(15, 2) GENERATED ALWAYS AS (base_cost + (base_cost * margin_percent / 100)) STORED,
    is_active        BOOLEAN DEFAULT TRUE,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS leads (
    id            SERIAL PRIMARY KEY,
    full_name     VARCHAR(150) NOT NULL,
    phone         VARCHAR(30),
    email         VARCHAR(150),
    address       TEXT,
    gender        VARCHAR(10) CHECK (gender IN ('pria', 'wanita')),
    requirements  TEXT,
    status        VARCHAR(30) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
    sales_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS projects (
    id                SERIAL PRIMARY KEY,
    project_name      VARCHAR(200) NOT NULL,
    lead_id           INTEGER NOT NULL REFERENCES leads(id) ON DELETE RESTRICT,
    sales_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status            VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'waiting_approval', 'approved', 'rejected')),
    notes             TEXT,
    needs_approval    BOOLEAN DEFAULT FALSE,
    approved_by       INTEGER REFERENCES users(id),
    approved_at       TIMESTAMPTZ,
    rejection_reason  TEXT,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS project_items (
    id                SERIAL PRIMARY KEY,
    project_id        INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    product_id        INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity          INTEGER NOT NULL DEFAULT 1,
    negotiated_price  NUMERIC(15, 2) NOT NULL,
    selling_price     NUMERIC(15, 2) NOT NULL,
    created_at        TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS customers (
    id            SERIAL PRIMARY KEY,
    full_name     VARCHAR(150) NOT NULL,
    phone         VARCHAR(30),
    email         VARCHAR(150),
    address       TEXT,
    gender        VARCHAR(10) CHECK (gender IN ('pria', 'wanita')),
    lead_id       INTEGER REFERENCES leads(id),
    sales_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    project_id    INTEGER REFERENCES projects(id),
    is_active     BOOLEAN DEFAULT TRUE,
    joined_at     TIMESTAMPTZ DEFAULT NOW(),
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
  );

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

  CREATE INDEX IF NOT EXISTS idx_leads_sales_id ON leads(sales_id);
  CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
  CREATE INDEX IF NOT EXISTS idx_projects_sales_id ON projects(sales_id);
  CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
  CREATE INDEX IF NOT EXISTS idx_customers_sales_id ON customers(sales_id);
  CREATE INDEX IF NOT EXISTS idx_project_items_project_id ON project_items(project_id);
`;

const runMigration = async (retries = 5, delay = 3000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    let client;
    try {
      console.log(`[Migration] Attempt ${attempt}/${retries} — connecting to database...`);
      
      const dbUrl = process.env.DATABASE_URL || '';
      console.log(`[Migration] Target Host: ${dbUrl.split('@')[1] ? dbUrl.split('@')[1].split(':')[0] : 'Unknown'}`);
      
      client = await pool.connect();
      console.log('[Migration] Database connected successfully.');
      
      console.log('[Migration] Starting database migration...');
      await client.query(SQL_CREATE_TABLES);
      console.log('[Migration] ✅ All tables created successfully.');
      return;
    } catch (error) {
      console.error(`[Migration] ❌ Attempt ${attempt} failed.`);
      console.error(`[Migration] Error Message: "${error.message}"`);
      console.error(`[Migration] Error Code: ${error.code || 'N/A'}`);
      
      if (attempt === retries) {
        console.error('[Migration] All retry attempts exhausted.');
        process.exit(1);
      }
      console.log(`[Migration] Retrying in ${delay / 1000}s...`);
      await new Promise((r) => setTimeout(r, delay));
    } finally {
      if (client) client.release();
    }
  }
};

runMigration()
  .catch(() => process.exit(1))
  .finally(() => pool.end());
