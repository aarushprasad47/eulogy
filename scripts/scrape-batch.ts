/**
 * Scrapes pricing data from funeral home websites in MongoDB.
 * Only updates a home if at least 1 new service is found — never creates homes.
 *
 * Run: npx tsx --env-file=.env.local scripts/scrape-batch.ts [limit] [offset]
 */

import { MongoClient } from "mongodb";
import * as cheerio from "cheerio";

const CONCURRENCY = 3;
const DELAY_MS    = 800;
const TIMEOUT_MS  = 10000;

const mongo = new MongoClient(process.env.MONGODB_URI!);

function mkid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 11);
}

function extractPrice(text: string) {
  const range = text.match(/\$([0-9,]+)\s*[-–—]\s*\$([0-9,]+)/);
  if (range) return { price: null, min: parseFloat(range[1].replace(/,/g, "")), max: parseFloat(range[2].replace(/,/g, "")) };
  const single = text.match(/\$\s*([0-9,]+(?:\.[0-9]{2})?)/);
  if (single) return { price: parseFloat(single[1].replace(/,/g, "")), min: null, max: null };
  return null;
}

function guessCategory(text: string): string {
  const l = text.toLowerCase();
  if (l.includes("basic service")) return "BASIC_SERVICES";
  if (l.includes("direct cremat") || l.includes("cremat")) return "DIRECT_CREMATION";
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

async function scrapeSite(url: string) {
  const normalized = url.startsWith("http") ? url : `https://${url}`;
  let res: Response;
  try {
    res = await fetch(normalized, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; EulogyBot/1.0; +https://eulogy.vercel.app)",
        "Accept": "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      redirect: "follow",
    });
  } catch { return []; }

  if (!res.ok) return [];

  const html = await res.text();
  const $ = cheerio.load(html);
  $("nav, footer, script, style, noscript, header").remove();

  const services: { name: string; price: number | null; min: number | null; max: number | null; category: string }[] = [];
  const seen = new Set<string>();
  const keywords = ["cremati", "burial", "funeral", "casket", "urn", "embalm", "transfer",
                    "service", "hearse", "limo", "viewing", "grave", "basic", "preparation"];

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

  // Strategy 2: definition lists
  $("dl").each((_, dl) => {
    const terms = $(dl).find("dt");
    const defs  = $(dl).find("dd");
    terms.each((i, dt) => {
      const nameText  = $(dt).text().replace(/\s+/g, " ").trim();
      const priceText = $(defs[i])?.text?.() || "";
      const p = extractPrice(priceText);
      if (p && (p.price || p.min) && !seen.has(nameText) && nameText.length < 150) {
        seen.add(nameText);
        services.push({ name: nameText, ...p, category: guessCategory(nameText) });
      }
    });
  });

  // Strategy 3: inline dollar amounts
  $("li, p, td, div").each((_, el) => {
    const text = $(el).clone().children().remove().end().text().replace(/\s+/g, " ").trim();
    if (text.length > 200 || text.length < 5) return;
    const p = extractPrice(text);
    if (!p || (!p.price && !p.min)) return;
    const name = text.replace(/\$[\s0-9,.\-–—]+/g, "").replace(/\s+/g, " ").trim().slice(0, 120);
    if (name.length < 4 || seen.has(name)) return;
    if (!keywords.some(k => name.toLowerCase().includes(k))) return;
    seen.add(name);
    services.push({ name, ...p, category: guessCategory(name) });
  });

  return services.slice(0, 50);
}

async function main() {
  await mongo.connect();
  const db = mongo.db();

  const args  = process.argv.slice(2);
  const limit = parseInt(args[0] || "500");

  // Only homes with a website — never create homes, only update existing
  const homes = await db.collection("FuneralHome")
    .find({ website: { $exists: true, $nin: [null, ""] } })
    .limit(limit)
    .toArray();

  console.log(`Found ${homes.length} homes with websites. Scraping...\n`);

  let attempted = 0, withPrices = 0, totalServices = 0;

  for (let i = 0; i < homes.length; i += CONCURRENCY) {
    const batch = homes.slice(i, i + CONCURRENCY);

    await Promise.allSettled(batch.map(async (h) => {
      attempted++;
      const scraped = await scrapeSite(h.website);

      // Skip entirely if nothing found — never update home with 0 services
      if (scraped.length === 0) return;

      // Deduplicate against names already stored
      const existingNames = new Set((h.services || []).map((s: any) => s.name));
      const newServices = scraped.filter(s => !existingNames.has(s.name));
      if (newServices.length === 0) return;

      const now = new Date();
      const embedded = newServices.map(s => ({
        id: mkid(),
        funeralHomeId: String(h._id),
        category: s.category,
        name: s.name,
        price: s.price,
        priceMin: s.min,
        priceMax: s.max,
        description: null,
        createdAt: now,
      }));

      await db.collection("FuneralHome").updateOne(
        { _id: h._id },
        {
          $push: { services: { $each: embedded } } as any,
          $set:  { dataSource: "SCRAPED", updatedAt: now },
        }
      );

      withPrices++;
      totalServices += embedded.length;
      console.log(`  ✓ ${h.name.slice(0, 40)}: +${embedded.length} new services`);
    }));

    if (i + CONCURRENCY < homes.length) {
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }

  console.log(`\nDone!`);
  console.log(`  Attempted : ${attempted}`);
  console.log(`  Updated   : ${withPrices}`);
  console.log(`  New svcs  : ${totalServices}`);

  await mongo.close();
}

main().catch(console.error);
