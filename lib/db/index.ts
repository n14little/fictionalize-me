import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: true }
      : false,
  max: 10, // Safe for Neon’s free tier
  connectionTimeoutMillis: 30000, // Handle cold starts
  idleTimeoutMillis: 10000, // Close idle connections
});

export default pool;

export const query = async (text: string, params?: unknown[]) => {
  try {
    const result = await pool.query(text, params);

    return result;
  } catch (error) {
    console.error('Query error', { text, error });
    throw error;
  }
};
