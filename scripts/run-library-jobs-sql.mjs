import "dotenv/config";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { neon } from "@neondatabase/serverless";

const __dirname = dirname(fileURLToPath(import.meta.url));
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(url);
const script = readFileSync(join(__dirname, "add-library-and-jobs.sql"), "utf8");
const statements = script
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s.length > 0 && !s.startsWith("--"));

for (const statement of statements) {
  console.log("Running:", statement.slice(0, 80).replace(/\s+/g, " ") + "...");
  await sql(statement);
}

console.log("Done — library categories, product extensions, and jobs tables applied.");
