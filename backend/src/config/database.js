const { Pool } = require('pg');

const isInternal = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('railway.internal');

const poolConfig = {
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
};

if (process.env.DATABASE_URL) {
  poolConfig.connectionString = process.env.DATABASE_URL;
  // Jika internal (railway.internal) biasanya tidak perlu SSL. 
  // Jika external (proxy/public) wajib pakai SSL rejectUnauthorized false.
  poolConfig.ssl = isInternal ? false : { rejectUnauthorized: false };
} else {
  poolConfig.host = process.env.DB_HOST;
  poolConfig.port = parseInt(process.env.DB_PORT, 10) || 5432;
  poolConfig.database = process.env.DB_NAME;
  poolConfig.user = process.env.DB_USER;
  poolConfig.password = process.env.DB_PASSWORD;
  poolConfig.ssl = false;
}

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('[Database] Unexpected error on idle client:', err);
  process.exit(-1);
});

const query = (text, params) => pool.query(text, params);
const getClient = () => pool.connect();

module.exports = { query, getClient, pool };
