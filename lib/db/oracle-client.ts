import oracledb, { type Connection } from "oracledb";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Falta la variable de entorno ${name} para la conexión Oracle.`,
    );
  }
  return value;
}

async function createPool(): Promise<oracledb.Pool> {
  return oracledb.createPool({
    user: requiredEnv("ORACLE_USER"),
    password: requiredEnv("ORACLE_PASSWORD"),
    connectString: requiredEnv("ORACLE_CONNECT_STRING"),
    poolMin: 1,
    poolMax: 4,
    poolIncrement: 1,
    poolTimeout: 300,
  });
}

const globalForOracle = globalThis as unknown as {
  __oraclePool?: Promise<oracledb.Pool>;
};

function getPool(): Promise<oracledb.Pool> {
  globalForOracle.__oraclePool ??= createPool();
  return globalForOracle.__oraclePool;
}

export async function withConnection<T>(
  handler: (connection: Connection) => Promise<T>,
): Promise<T> {
  const pool = await getPool();
  const connection = await pool.getConnection();
  try {
    return await handler(connection);
  } finally {
    await connection.close();
  }
}
