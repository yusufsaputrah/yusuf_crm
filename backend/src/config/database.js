/**
 * @file database.js
 * @description PostgreSQL connection pool configuration using pg library.
 * Reads credentials from environment variables for security.
 */

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 10, // maximum pool connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('[Database] Unexpected error on idle client:', err);
  process.exit(-1);
});

/**
 * Execute a query against the database pool.
 * @param {string} text - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<import('pg').QueryResult>}
 */
const query = (text, params) => pool.query(text, params);

/**
 * Get a client from the pool (for transactions).
 * @returns {Promise<import('pg').PoolClient>}
 */
const getClient = () => pool.connect();

module.exports = { query, getClient, pool };
