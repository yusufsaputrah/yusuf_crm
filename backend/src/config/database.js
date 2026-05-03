const { Pool } = require('pg');

const poolConfig = {
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
};

if (process.env.DATABASE_URL) {
  poolConfig.connectionString = process.env.DATABASE_URL;
  
  // Deteksi otomatis: Jika alamat mengandung 'railway.internal', JANGAN pakai SSL.
  // Jika alamat publik (proxy), WAJIB pakai SSL.
  if (process.env.DATABASE_URL.includes('railway.internal')) {
    poolConfig.ssl = false;
  } else {
    poolConfig.ssl = { rejectUnauthorized: false };
  }
} else {
  poolConfig.host = process.env.DB_HOST;
  poolConfig.port = parseInt(process.env.DB_PORT, 10) || 5432;
  poolConfig.database = process.env.DB_NAME;
  poolConfig.user = process.env.DB_USER;
  poolConfig.password = process.env.DB_PASSWORD;
  
  // Default untuk variabel satuan biasanya proxy publik, jadi pakai SSL
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('[Database] Unexpected error on idle client:', err);
  process.exit(-1);
});

const query = (text, params) => pool.query(text, params);
const getClient = () => pool.connect();

module.exports = { query, getClient, pool };
