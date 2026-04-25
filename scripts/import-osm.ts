/**
 * Imports US funeral homes from OpenStreetMap via the Overpass API.
 * Free, no API key needed, legal (ODbL license).
 * Run: npx tsx --env-file=.env.local scripts/import-osm.ts
 */

import "dotenv/config";
import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// US divided into 6 regions to stay well under Overpass timeout limits
const US_REGIONS = [
  { name: "Northeast",   bbox: "37.0,-82.0,47.5,-66.0" },
  { name: "Southeast",   bbox: "24.0,-92.0,37.0,-75.0" },
  { name: "Midwest",     bbox: "36.0,-104.0,49.0,-80.0" },
  { name: "South",       bbox: "25.0,-106.0,37.0,-89.0" },
  { name: "West",        bbox: "32.0,-125.0,50.0,-104.0" },
  { name: "Alaska+HI",   bbox: "18.0,-178.0,72.0,-130.0" },
];

interface OSMElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function cuid(): string {
  return "osm" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

async function fetchRegion(bbox: string): Promise<OSMElement[]> {
  const [s, w, n, e] = bbox.split(",");
  const query = `[out:json][timeout:50];
(
  node["amenity"="funeral_hall"](${s},${w},${n},${e});
  way["amenity"="funeral_hall"](${s},${w},${n},${e});
  node["shop"="funeral_directors"](${s},${w},${n},${e});
  way["shop"="funeral_directors"](${s},${w},${n},${e});
);
out center;`;

  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: query,
    headers: { "Content-Type": "text/plain", "User-Agent": "EulogyBot/1.0 funeral-price-transparency" },
    signal: AbortSignal.timeout(60000),
  });

  if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);
  const data = await res.json() as { elements: OSMElement[] };
  return data.elements || [];
}

function parseElement(el: OSMElement, stateCode: string) {
  const t = el.tags || {};
  const name = t.name || t["name:en"];
  if (!name) return null;

  const lat = el.lat ?? el.center?.lat ?? null;
  const lng = el.lon ?? el.center?.lon ?? null;

  const street = t["addr:street"] || "";
  const housenumber = t["addr:housenumber"] || "";
  const address = [housenumber, street].filter(Boolean).join(" ") || "Address on file";
  const city = t["addr:city"] || t["addr:suburb"] || "";
  const state = t["addr:state"] || stateCode;
  const zip = t["addr:postcode"] || "";

  // Clean phone
  const rawPhone = t.phone || t["contact:phone"] || t["phone:1"] || null;
  const phone = rawPhone
    ? rawPhone.replace(/[^\d+\-() ]/g, "").trim().slice(0, 20)
    : null;

  const website = t.website || t["contact:website"] || t.url || null;
  const email = t.email || t["contact:email"] || null;

  // Need at least city or zip to be useful
  if (!city && !zip) return null;

  return {
    id: `osm-${el.id}`,
    name: name.trim().slice(0, 200),
    address: address.trim().slice(0, 200),
    city: city.trim().slice(0, 100),
    state: state.trim().slice(0, 2).toUpperCase(),
    zip: zip.trim().slice(0, 10),
    phone,
    email,
    website: website ? website.trim().slice(0, 500) : null,
    verified: 0,
    dataSource: "SCRAPED",
    lat,
    lng,
  };
}

async function importRegion(regionName: string, bbox: string): Promise<{ inserted: number; skipped: number }> {
  let elements: OSMElement[];
  try {
    elements = await fetchRegion(bbox);
  } catch (err) {
    console.error(`  [${regionName}] fetch error: ${err}`);
    return { inserted: 0, skipped: 0 };
  }

  let inserted = 0;
  let skipped = 0;
  const now = new Date().toISOString();

  for (const el of elements) {
    // Infer state from addr:state tag or leave empty
    const stateCode = el.tags?.["addr:state"] || "";
    const home = parseElement(el, stateCode);
    if (!home) { skipped++; continue; }

    try {
      const result = await db.execute({
        sql: `INSERT OR IGNORE INTO FuneralHome
                (id, name, address, city, state, zip, phone, email, website,
                 verified, dataSource, lat, lng, createdAt, updatedAt)
              VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        args: [
          home.id, home.name, home.address, home.city, home.state, home.zip,
          home.phone, home.email, home.website,
          home.verified, home.dataSource, home.lat, home.lng,
          now, now,
        ],
      });
      if (result.rowsAffected > 0) inserted++;
      else skipped++;
    } catch {
      skipped++;
    }
  }

  return { inserted, skipped };
}

async function main() {
  console.log("Importing US funeral homes from OpenStreetMap (bounding box method)...\n");

  let totalInserted = 0;
  let totalSkipped = 0;

  for (let i = 0; i < US_REGIONS.length; i++) {
    const { name, bbox } = US_REGIONS[i];
    process.stdout.write(`[${i + 1}/${US_REGIONS.length}] ${name}... `);

    const { inserted, skipped } = await importRegion(name, bbox);
    totalInserted += inserted;
    totalSkipped += skipped;

    console.log(`+${inserted} new (${skipped} skipped) | total: ${totalInserted}`);

    if (i < US_REGIONS.length - 1) await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`\nDone! Imported ${totalInserted} funeral homes.`);
  console.log(`Skipped ${totalSkipped} (duplicates or missing data).`);

  const countRow = await db.execute("SELECT COUNT(*) as n FROM FuneralHome");
  const withWebsite = await db.execute("SELECT COUNT(*) as n FROM FuneralHome WHERE website IS NOT NULL");
  console.log(`\nDatabase totals:`);
  console.log(`  Total homes: ${countRow.rows[0].n}`);
  console.log(`  With websites (scrapeable): ${withWebsite.rows[0].n}`);
}

main().catch(console.error);
