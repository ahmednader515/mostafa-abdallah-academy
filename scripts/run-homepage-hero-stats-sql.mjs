import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

await sql`ALTER TABLE "HomepageSetting" ADD COLUMN IF NOT EXISTS hero_slides_json TEXT`;
await sql`ALTER TABLE "HomepageSetting" ADD COLUMN IF NOT EXISTS stats_ribbon_json TEXT`;
await sql`ALTER TABLE "HomepageSetting" ADD COLUMN IF NOT EXISTS main_nav_flags_json TEXT`;
console.log("homepage hero/stats/nav columns ready");
