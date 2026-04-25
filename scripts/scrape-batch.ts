/**
 * Scrapes pricing data from all funeral homes in the DB that have websites.
 * Run after import-osm.ts: npx tsx --env-file=.env.local scripts/scrape-batch.ts
 */

import "dotenv/config";
import { createClient } from "@libsql/client";
import * as cheerio from "cheerio";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const CONCURRENCY = 3;   // parallel requests
const DELAY_MS = 800;    // delay between batches
const TIMEOUT_MS = 10000;

function cuid(): string {
  return "sc" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function extractPrice(text: string) {
  const rangeMatch = text.match(/\$([0-9,]+)\s*[-–—]\s*\$([0-9,]+)/);
  if (rangeMatch) return {
    price: null,
    min: parseFloat(rangeMatch[1].replace(/,/g, "")),
    max: parseFloat(rangeMatch[2].replace(/,/g, "")),
  };
  const single = text.match(/\$\s*([0-9,]+(?:\.[0-9]{2})?)/);
  if (single) return { price: parseFloat(single[1].replace(/,/g, "")), min: null, max: null };
  return null;
}

function guessCategory(text: string): string {
  const l = text.toLowerCase();
  if (l.includes("basic service")) return "BASIC_SERVICES";
  if (l.includes("direct cremat")) return "DIRECT_CREMATION";
  if (l.includes("cremat")) return "DIRECT_CREMATION";
  if (l.includes("immediate burial")) return "IMMEDIATE_BURIAL";
  if (l.includes("forward")) return "FORWARDING_REMAINS";
  if (l.includes("receiv")) return "RECEIVING_REMAINS";
  if (l.includes("full funeral") || l.includes("traditional")) return "FULL_FUNERAL_SERVICE";
  if (l.includes("graveside")) return "GRAVESIDE_SERVICE";
  if (l.includes("transfer")) return "TRANSFER_OF_REMAINS";
  if (l.includes("embalm")) return "EMBALMING";
  if (l.includes("prepar") || l.includes("dressing")) return "BODY_PREPARATION";
  if (l.includes("viewing") || l.includes("visitation")) return "VIEWING_FACILITIES";
  if (l.includes("hearse")) return "HEARSE";
  if (l.includes("limo")) return "LIMOUSINE";
  if (l.includes("casket") || l.includes("coffin")) return "CASKET";
  if (l.includes("urn")) return "URN";
  if (l.includes("vault") || l.includes("burial container") || l.includes("liner")) return "OUTER_BURIAL_CONTAINER";
  return "OTHER";
}

interface Service {
  name: string;
  price: number | null;
  min: number | null;
  max: number | null;
  category: string;
}

async function scrapeSite(url: string): Promise<Service[]> {
  const normalized = url.startsWith("http") ? url : `https://${url}`;

  const res = await fetch(normalized, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; EulogyBot/1.0; +https://eulogy-nu.vercel.app)",
      "Accept": "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    redirect: "follow",
  });

  if (!res.ok) return [];

  const html = await res.text();
  const $ = cheerio.load(html);

  // Remove nav/footer/scripts to reduce noise
  $("nav, footer, script, style, noscript, header").remove();

  const services: Service[] = [];
  const seen = new Set<string>();

  // Strategy 1: price tables
  $("table tr").each((_, row) => {
    const cells = $(row).find("td, th");
    if (cells.length < 2) return;
    const nameText = $(cells[0]).text().replace(/\s+/g, " ").trim();
    const priceText = $(cells[cells.length - 1]).text().trim();
    if (!nameText || nameText.length > 150) return;
    const p = extractPrice(priceText);
    if (p && (p.price || p.min) && !seen.has(nameText)) {
      seen.add(nameText);
      services.push({ name: nameText, ...p, category: guessCategory(nameText) });
    }
  });

  // Strategy 2: definition lists (dl/dt/dd pattern)
  $("dl").each((_, dl) => {
    const terms = $(dl).find("dt");
    const defs = $(dl).find("dd");
    terms.each((i, dt) => {
      const nameText = $(dt).text().replace(/\s+/g, " ").trim();
      const priceText = $(defs[i])?.text?.() || "";
      const p = extractPrice(priceText);
      if (p && (p.price || p.min) && !seen.has(nameText) && nameText.length < 150) {
        seen.add(nameText);
        services.push({ name: nameText, ...p, category: guessCategory(nameText) });
      }
    });
  });

  // Strategy 3: inline dollar amounts in list items / paragraphs
  $("li, p, td, div").each((_, el) => {
    const text = $(el).clone().children().remove().end().text().replace(/\s+/g, " ").trim();
    if (text.length > 200 || text.length < 5) return;
    const p = extractPrice(text);
    if (!p || (!p.price && !p.min)) return;

    // Clean the name: remove the price portion
    const name = text.replace(/\$[\s0-9,.\-–—]+/g, "").replace(/\s+/g, " ").trim().slice(0, 120);
    if (name.length < 4 || seen.has(name)) return;

    // Only include if it looks like a funeral service name
    const keywords = ["cremati", "burial", "funeral", "casket", "urn", "embalm", "transfer",
                       "service", "hearse", "limo", "viewing", "grave", "basic", "preparation"];
    if (!keywords.some(k => name.toLowerCase().includes(k))) return;

    seen.add(name);
    services.push({ name, ...p, category: guessCategory(name) });
  });

  return services.slice(0, 50); // cap per site
}

async function processBatch(homes: { id: string; website: string; name: string }[]) {
  return Promise.allSettled(
    homes.map(async (h) => {
      const services = await scrapeSite(h.website);
      if (services.length === 0) return { id: h.id, count: 0 };

      const now = new Date().toISOString();
      for (const s of services) {
        await db.execute({
          sql: `INSERT OR IGNORE INTO Service
                  (id, funeralHomeId, category, name, price, priceMin, priceMax, description, createdAt)
                VALUES (?,?,?,?,?,?,?,?,?)`,
          args: [cuid(), h.id, s.category, s.name, s.price, s.min, s.max, null, now],
        });
      }

      await db.execute({
        sql: "UPDATE FuneralHome SET dataSource='SCRAPED', updatedAt=? WHERE id=?",
        args: [now, h.id],
      });

      return { id: h.id, count: services.length };
    })
  );
}

async function main() {
  const args = process.argv.slice(2);
  const limit = parseInt(args[0] || "500");
  const offset = parseInt(args[1] || "0");

  console.log(`Batch scraping up to ${limit} homes (offset ${offset})...\n`);

  // Get homes with websites that don't yet have services
  const rows = await db.execute({
    sql: `SELECT f.id, f.website, f.name
          FROM FuneralHome f
          LEFT JOIN Service s ON s.funeralHomeId = f.id
          WHERE f.website IS NOT NULL
            AND s.id IS NULL
          LIMIT ? OFFSET ?`,
    args: [limit, offset],
  });

  const homes = rows.rows as unknown as { id: string; website: string; name: string }[];
  console.log(`Found ${homes.length} homes with websites and no price data yet.\n`);

  let totalFound = 0;
  let attempted = 0;
  let withPrices = 0;

  for (let i = 0; i < homes.length; i += CONCURRENCY) {
    const batch = homes.slice(i, i + CONCURRENCY);
    const results = await processBatch(batch);

    for (const r of results) {
      attempted++;
      if (r.status === "fulfilled" && r.value.count > 0) {
        withPrices++;
        totalFound += r.value.count;
        process.stdout.write(`  ✓ ${batch[results.indexOf(r)]?.name?.slice(0, 40)}: ${r.value.count} prices\n`);
      }
    }

    const pct = Math.round((attempted / homes.length) * 100);
    process.stdout.write(`\rProgress: ${attempted}/${homes.length} (${pct}%) | Homes with prices: ${withPrices} | Services: ${totalFound}  `);

    if (i + CONCURRENCY < homes.length) {
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }

  console.log(`\n\nDone!`);
  console.log(`  Attempted: ${attempted}`);
  console.log(`  With prices found: ${withPrices}`);
  console.log(`  Total services stored: ${totalFound}`);

  const totals = await db.execute(`
    SELECT
      (SELECT COUNT(*) FROM FuneralHome) as homes,
      (SELECT COUNT(*) FROM FuneralHome WHERE website IS NOT NULL) as withWebsite,
      (SELECT COUNT(DISTINCT funeralHomeId) FROM Service) as withPrices,
      (SELECT COUNT(*) FROM Service) as totalServices
  `);
  const t = totals.rows[0];
  console.log(`\nDatabase totals:`);
  console.log(`  Funeral homes: ${t.homes}`);
  console.log(`  With websites: ${t.withWebsite}`);
  console.log(`  With price data: ${t.withPrices}`);
  console.log(`  Total services: ${t.totalServices}`);
}

main().catch(console.error);
