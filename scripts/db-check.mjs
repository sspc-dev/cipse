import oracledb from "oracledb";

const { ORACLE_USER, ORACLE_PASSWORD, ORACLE_CONNECT_STRING } = process.env;

if (!ORACLE_USER || !ORACLE_PASSWORD || !ORACLE_CONNECT_STRING) {
  console.error(
    "Configure ORACLE_USER, ORACLE_PASSWORD y ORACLE_CONNECT_STRING en .env.local.",
  );
  process.exit(1);
}

async function main() {
  const pool = await oracledb.createPool({
    user: ORACLE_USER,
    password: ORACLE_PASSWORD,
    connectString: ORACLE_CONNECT_STRING,
  });

  const connection = await pool.getConnection();

  try {
    const result = await connection.execute("SELECT 1 AS ok FROM DUAL");
    console.log("Conexión Oracle correcta:", result.rows);
  } finally {
    await connection.close();
    await pool.close();
  }
}

main().catch((error) => {
  console.error("Fallo la conexión Oracle:", error);
  process.exit(1);
});
