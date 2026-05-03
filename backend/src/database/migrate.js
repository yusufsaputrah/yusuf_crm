require('dotenv').config();
const { pool } = require('../config/database');

const runMigration = async (retries = 5, delay = 3000) => {
  console.log('--- [Environment Debug] ---');
  console.log('Available Variable Keys:', Object.keys(process.env).filter(k => k.includes('DB') || k.includes('URL') || k.includes('JWT')));
  console.log('DATABASE_URL exists?', !!process.env.DATABASE_URL);
  if (process.env.DATABASE_URL) {
    console.log('DATABASE_URL length:', process.env.DATABASE_URL.length);
  }
  console.log('---------------------------');

  for (let attempt = 1; attempt <= retries; attempt++) {
    let client;
    try {
      console.log(`[Migration] Attempt ${attempt}/${retries} — connecting...`);
      
      if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is MISSING or EMPTY in process.env');
      }

      client = await pool.connect();
      console.log('[Migration] ✅ Connected!');
      // ... (lanjutkan query SELECT NOW dll)
      return;
    } catch (error) {
      console.error(`[Migration] ❌ Attempt ${attempt} failed.`);
      console.error(`[Migration] Message: "${error.message}"`);
      
      if (attempt === retries) process.exit(1);
      await new Promise((r) => setTimeout(r, delay));
    } finally {
      if (client) client.release();
    }
  }
};

runMigration().then(() => pool.end());
