import mysql from "mysql2/promise";

const { MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE } =
  process.env;

if (!MYSQL_USER || !MYSQL_PASSWORD || !MYSQL_DATABASE) {
  console.error(
    "Configure MYSQL_USER, MYSQL_PASSWORD y MYSQL_DATABASE en .env (por defecto: docker compose up -d).",
  );
  process.exit(1);
}

async function main() {
  const connection = await mysql.createConnection({
    host: MYSQL_HOST ?? "127.0.0.1",
    port: Number(MYSQL_PORT ?? 3306),
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    database: MYSQL_DATABASE,
  });

  try {
    await connection.query("SELECT 1");
    const [rows] = await connection.query(
      "SELECT COUNT(*) AS total FROM accreditations",
    );
    console.log("Conexión MySQL correcta:", rows);
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error("Fallo la conexión MySQL:", error.message);
  process.exit(1);
});
