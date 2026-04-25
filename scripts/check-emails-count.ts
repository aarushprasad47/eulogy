import { createClient } from "@libsql/client";

const db = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN });

async function main() {
  const r = await db.execute("SELECT COUNT(*) as n FROM FuneralHome WHERE email IS NOT NULL");
  const r2 = await db.execute("SELECT COUNT(*) as n FROM FuneralHome WHERE email IS NOT NULL AND website IS NOT NULL");
  const r3 = await db.execute("SELECT email, name, city, state FROM FuneralHome WHERE email IS NOT NULL LIMIT 5");
  console.log("With email:", r.rows[0].n);
  console.log("With email AND website:", r2.rows[0].n);
  console.log("Sample emails:", JSON.stringify(r3.rows, null, 2));
}
main().catch(console.error);
