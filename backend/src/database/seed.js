require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

const SALT_ROUNDS = 10;

const runSeed = async (retryCount = 5) => {
  for (let i = 0; i < retryCount; i++) {
    let client;
    try {
      console.log(`[Seed] Attempt ${i + 1} of ${retryCount}...`);
      client = await pool.connect();
      console.log('[Seed] Database connected.');
      
      console.log('[Seed] Starting database seeding...');

      const hashedPassword = await bcrypt.hash('password123', SALT_ROUNDS);

      await client.query(`
        INSERT INTO users (full_name, email, password, role) VALUES
          ('Admin Manager',  'manager@smart.id',  $1, 'manager'),
          ('Sales Budi',     'budi@smart.id',     $1, 'sales'),
          ('Sales Sari',     'sari@smart.id',     $1, 'sales')
        ON CONFLICT (email) DO NOTHING;
      `, [hashedPassword]);

      console.log('[Seed] ✅ Users seeded (default password: password123)');

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
      
      return; // Success, exit the loop
    } catch (error) {
      console.error(`[Seed] ❌ Attempt ${i + 1} failed:`, error.message);
      
      if (i === retryCount - 1) {
        console.error('[Seed] ❌ Maximum retries reached. Exiting.');
        process.exit(1);
      }
      
      const waitTime = Math.pow(2, i) * 1000;
      console.log(`[Seed] Retrying in ${waitTime / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    } finally {
      if (client) client.release();
    }
  }
};

runSeed().then(() => {
  pool.end();
});
