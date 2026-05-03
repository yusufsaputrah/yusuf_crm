/**
 * @file seed.js
 * @description Seed script to populate initial data for development/demo purposes.
 * Creates default users (manager + sales) and sample products.
 * Run with: npm run seed
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

const SALT_ROUNDS = 10;

const runSeed = async () => {
  const client = await pool.connect();
  try {
    console.log('[Seed] Starting database seeding...');

    const hashedPassword = await bcrypt.hash('password123', SALT_ROUNDS);

    // --- Seed Users ---
    await client.query(`
      INSERT INTO users (full_name, email, password, role) VALUES
        ('Admin Manager',  'manager@smart.id',  $1, 'manager'),
        ('Sales Budi',     'budi@smart.id',     $1, 'sales'),
        ('Sales Sari',     'sari@smart.id',     $1, 'sales')
      ON CONFLICT (email) DO NOTHING;
    `, [hashedPassword]);

    console.log('[Seed] ✅ Users seeded (default password: password123)');

    // --- Seed Products ---
    await client.query(`
      INSERT INTO products (product_name, description, base_cost, margin_percent) VALUES
        ('Paket Internet 20 Mbps',  'Paket rumahan kecepatan 20 Mbps',  150000, 33.33),
        ('Paket Internet 50 Mbps',  'Paket rumahan kecepatan 50 Mbps',  250000, 32.00),
        ('Paket Internet 100 Mbps', 'Paket premium kecepatan 100 Mbps', 400000, 25.00),
        ('Paket Bisnis 200 Mbps',   'Dedicated line untuk bisnis',      800000, 25.00),
        ('Paket Enterprise 500 Mbps','Enterprise fiber optic solution', 1500000, 20.00)
      ON CONFLICT DO NOTHING;
    `);

    console.log('[Seed] ✅ Products seeded');
    console.log('[Seed] 🎉 Seeding completed successfully!');
    console.log('[Seed] Default credentials:');
    console.log('  manager@smart.id  / password123 (Manager)');
    console.log('  budi@smart.id     / password123 (Sales)');
    console.log('  sari@smart.id     / password123 (Sales)');
  } catch (error) {
    console.error('[Seed] ❌ Seeding failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

runSeed();
