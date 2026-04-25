// Run: npx tsx --env-file=.env.local scripts/update-latlng.ts
import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const COORDS: { id: string; lat: number; lng: number }[] = [
  { id: "pe8bwt9vmpj5utci9i", lat: 34.1343, lng: -118.2547 }, // Forest Lawn (Glendale)
  { id: "cmwjkqh64veq9ukays", lat: 34.0903, lng: -118.3182 }, // Hollywood Forever
  { id: "3u51fqskcsaoxo48qe", lat: 34.1856, lng: -118.3457 }, // Affordable Cremation (Burbank)
  { id: "fkc09ry8gy5glqd11e", lat: 34.0607, lng: -118.1226 }, // Pacific Funeral (Monterey Park)
  { id: "bgohfoljhknd0ggyr2", lat: 34.0396, lng: -118.2038 }, // Dignidad (East LA)
  { id: "q1nl10sm8mtx5vajtm", lat: 34.0600, lng: -118.4439 }, // Pierce Brothers (Westwood)
  { id: "qv4gnljrxowawan1uu", lat: 33.9932, lng: -117.9908 }, // Rose Hills (Whittier)
  { id: "ozc50gz3h2ir561wn1", lat: 33.9000, lng: -118.3985 }, // South Bay (Manhattan Beach)
  { id: "m6afuwttxnww4r8f1c", lat: 33.9050, lng: -118.2097 }, // Angeles Abbey (Compton)
  { id: "eppjjlybyrcoy1jzs6", lat: 33.9075, lng: -118.3519 }, // Eckols (Hawthorne)
];

async function run() {
  for (const { id, lat, lng } of COORDS) {
    await db.execute({
      sql: "UPDATE FuneralHome SET lat = ?, lng = ? WHERE id = ?",
      args: [lat, lng, id],
    });
    console.log(`Updated ${id} → (${lat}, ${lng})`);
  }
  console.log("Done.");
  await db.close();
}

run().catch((e) => { console.error(e); process.exit(1); });
