import { Pool } from 'pg';

const connectionString =
  process.env.POSTGRES_URL ||
  'postgresql://neondb_owner:npg_LFNBVJC4M9mZ@ep-blue-dream-b4fmcwi9-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require';

let pool: Pool;

if (process.env.NODE_ENV === 'production') {
  pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
} else {
  if (!(global as any)._postgresPool) {
    (global as any)._postgresPool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  pool = (global as any)._postgresPool;
}

export default pool;
