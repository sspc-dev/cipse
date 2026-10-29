import {
  createPool as createMysqlPool,
  type Pool,
  type PoolConnection,
} from "mysql2/promise";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Falta la variable de entorno ${name} para la conexión MySQL.`,
    );
  }
  return value;
}

function optionalEnv(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

async function createPool(): Promise<Pool> {
  return createMysqlPool({
    host: optionalEnv("MYSQL_HOST", "127.0.0.1"),
    port: Number(optionalEnv("MYSQL_PORT", "3306")),
    user: requiredEnv("MYSQL_USER"),
    password: requiredEnv("MYSQL_PASSWORD"),
    database: requiredEnv("MYSQL_DATABASE"),
    connectionLimit: 4,
    waitForConnections: true,
    timezone: "Z",
  });
}

const globalForMysql = globalThis as unknown as {
  __mysqlPool?: Promise<Pool>;
};

function getPool(): Promise<Pool> {
  globalForMysql.__mysqlPool ??= createPool();
  return globalForMysql.__mysqlPool;
}

export async function withConnection<T>(
  handler: (connection: PoolConnection) => Promise<T>,
): Promise<T> {
  const pool = await getPool();
  const connection = await pool.getConnection();
  try {
    return await handler(connection);
  } finally {
    connection.release();
  }
}
