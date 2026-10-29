import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import mysql from "mysql2/promise";
import { randomBytes, scryptSync } from "node:crypto";

function parseArg(flag) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const interactive = stdin.isTTY;
const rl = readline.createInterface({ input: stdin, output: stdout, terminal: interactive });

const pipedLines = [];
if (!interactive) {
  // Modo con entrada canalizada (p. ej. pruebas): consumir líneas disponibles.
  for await (const chunk of stdin) {
    pipedLines.push(...chunk.toString().split("\n").filter(Boolean));
  }
}

let lineCursor = 0;

async function ask(prompt) {
  if (!interactive) {
    return pipedLines[lineCursor++] ?? "";
  }
  const answer = await rl.question(prompt + ": ");
  return answer;
}

let name = parseArg("--name");
let email = parseArg("--email");
let password = parseArg("--password");

if (interactive) {
  console.log("Alta de acreditador del CIPSE XV");
}

if (!name) name = await ask("--nombre del acreditador");
if (!email) email = await ask("--email");
if (!password) password = await ask("--password (mín. 8)");
rl.close();

name = name?.trim() ?? "";
email = email?.trim().toLowerCase() ?? "";
password = password?.trim() ?? "";

if (!name || !email.includes("@") || password.length < 8) {
  console.error(
    "Datos incompletos: se requiere nombre, email válido y contraseña de al menos 8 caracteres.",
  );
  process.exit(1);
}

// Mismo formato que lib/features/auth/crypto.ts: scrypt$<salt-b64>$<hash-b64>
const salt = randomBytes(16);
const hash = scryptSync(password, salt, 64);
const passwordHash = `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;

const connection = await mysql.createConnection({
  host: process.env.MYSQL_HOST ?? "127.0.0.1",
  port: Number(process.env.MYSQL_PORT ?? 3306),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  multipleStatements: false,
});

try {
  const [existing] = await connection.query(
    "SELECT id FROM admin_users WHERE email = ?",
    [email],
  );

  if (existing.length > 0) {
    await connection.query(
      "UPDATE admin_users SET name = ?, password_hash = ?, is_active = 1 WHERE email = ?",
      [name, passwordHash, email],
    );
    console.log(`Acreditador actualizado: ${email}`);
  } else {
    await connection.query(
      "INSERT INTO admin_users (name, email, password_hash) VALUES (?, ?, ?)",
      [name, email, passwordHash],
    );
    console.log(`Acreditador creado: ${email}`);
  }
} finally {
  await connection.end();
}
