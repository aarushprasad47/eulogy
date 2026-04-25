import "dotenv/config";
import { createClient } from "@libsql/client";

function cuid(): string {
  return Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
}

const TURSO_URL = process.env.TURSO_DATABASE_URL!;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_URL) {
  console.error("TURSO_DATABASE_URL is not set. Add it to .env.local");
  process.exit(1);
}

const db = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

const homes = [
  {
    id: "serenity-funeral-home",
    name: "Serenity Funeral Home",
    address: "1234 Oak Street",
    city: "Seattle",
    state: "WA",
    zip: "98101",
    phone: "(206) 555-0101",
    email: "info@serenityfh.example",
    website: "https://serenityfh.example",
    verified: 1,
    dataSource: "SELF_REPORTED",
    lat: 47.6062,
    lng: -122.3321,
    services: [
      { category: "BASIC_SERVICES", name: "Basic Services of Funeral Director & Staff", price: 2195 },
      { category: "DIRECT_CREMATION", name: "Direct Cremation (no viewing)", price: 895 },
      { category: "IMMEDIATE_BURIAL", name: "Immediate Burial (no viewing)", price: 1495 },
      { category: "FULL_FUNERAL_SERVICE", name: "Full Traditional Funeral Service", price: 4800 },
      { category: "EMBALMING", name: "Embalming", price: 750 },
      { category: "TRANSFER_OF_REMAINS", name: "Transfer of Remains to Funeral Home", price: 395 },
      { category: "HEARSE", name: "Hearse (local)", price: 325 },
      { category: "LIMOUSINE", name: "Family Limousine", price: 295 },
      { category: "CASKET", name: "Hardwood Casket (Cherry)", price: 2800 },
      { category: "CASKET", name: "Steel Casket (18-gauge)", price: 1400 },
      { category: "URN", name: "Marble Urn", price: 350 },
      { category: "URN", name: "Biodegradable Urn", price: 125 },
    ],
  },
  {
    id: "cascade-memorial-services",
    name: "Cascade Memorial Services",
    address: "890 Pine Avenue",
    city: "Seattle",
    state: "WA",
    zip: "98103",
    phone: "(206) 555-0202",
    email: "contact@cascadememorial.example",
    website: "https://cascadememorial.example",
    verified: 1,
    dataSource: "SCRAPED",
    lat: 47.6588,
    lng: -122.3497,
    services: [
      { category: "BASIC_SERVICES", name: "Basic Services Fee", price: 1950 },
      { category: "DIRECT_CREMATION", name: "Direct Cremation Package", price: 795 },
      { category: "IMMEDIATE_BURIAL", name: "Immediate Burial Package", price: 1295 },
      { category: "FULL_FUNERAL_SERVICE", name: "Complete Funeral Service", price: 5200 },
      { category: "EMBALMING", name: "Embalming (when selected)", price: 650 },
      { category: "TRANSFER_OF_REMAINS", name: "Removal from Place of Death", price: 350 },
      { category: "HEARSE", name: "Hearse Service", price: 295 },
      { category: "CASKET", name: "Cloth-Covered Wood Casket", price: 995 },
      { category: "CASKET", name: "Premium Bronze Casket", price: 4500 },
      { category: "URN", name: "Wood Urn", price: 195 },
    ],
  },
  {
    id: "pacific-northwest-cremation",
    name: "Pacific Northwest Cremation",
    address: "456 Elm Boulevard",
    city: "Bellevue",
    state: "WA",
    zip: "98004",
    phone: "(425) 555-0303",
    email: "hello@pnwcremation.example",
    website: "https://pnwcremation.example",
    verified: 0,
    dataSource: "EMAIL_RESPONSE",
    lat: 47.6101,
    lng: -122.2015,
    services: [
      { category: "BASIC_SERVICES", name: "Basic Services", price: 1750 },
      { category: "DIRECT_CREMATION", name: "Simple Cremation (no ceremony)", price: 695 },
      { category: "DIRECT_CREMATION", name: "Cremation with Memorial Service", price: 2100 },
      { category: "IMMEDIATE_BURIAL", name: "Direct Burial", price: 1195 },
      { category: "TRANSFER_OF_REMAINS", name: "Transfer within 50 miles", price: 285 },
      { category: "URN", name: "Standard Cremation Urn", price: 95 },
      { category: "URN", name: "Personalized Photo Urn", price: 275 },
      { category: "BODY_PREPARATION", name: "Washing & Dressing", price: 175 },
    ],
  },
  {
    id: "heritage-funeral-chapel",
    name: "Heritage Funeral Chapel",
    address: "2100 Main Street",
    city: "Tacoma",
    state: "WA",
    zip: "98402",
    phone: "(253) 555-0404",
    email: "info@heritagechapel.example",
    website: null,
    verified: 1,
    dataSource: "SELF_REPORTED",
    lat: 47.2529,
    lng: -122.4443,
    services: [
      { category: "BASIC_SERVICES", name: "Professional Services Fee", price: 2400 },
      { category: "DIRECT_CREMATION", name: "Direct Cremation", price: 1050 },
      { category: "IMMEDIATE_BURIAL", name: "Immediate Burial", price: 1600 },
      { category: "FULL_FUNERAL_SERVICE", name: "Full Service Funeral", price: 5800 },
      { category: "GRAVESIDE_SERVICE", name: "Graveside Service Only", price: 1200 },
      { category: "EMBALMING", name: "Embalming", price: 800 },
      { category: "TRANSFER_OF_REMAINS", name: "Transfer of Remains", price: 425 },
      { category: "HEARSE", name: "Hearse", price: 350 },
      { category: "CASKET", name: "Poplar Wood Casket", price: 1200 },
      { category: "CASKET", name: "Mahogany Casket", price: 3600 },
      { category: "URN", name: "Ceramic Urn", price: 250 },
      { category: "OUTER_BURIAL_CONTAINER", name: "Concrete Burial Vault", price: 1350 },
    ],
  },
];

async function main() {
  console.log(`Seeding Turso database at ${TURSO_URL}...`);

  for (const h of homes) {
    const { services, ...hd } = h;
    const now = new Date().toISOString();

    await db.execute({
      sql: `INSERT OR IGNORE INTO FuneralHome
              (id, name, address, city, state, zip, phone, email, website,
               verified, dataSource, lat, lng, createdAt, updatedAt)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [hd.id, hd.name, hd.address, hd.city, hd.state, hd.zip,
             hd.phone, hd.email, hd.website, hd.verified, hd.dataSource,
             hd.lat, hd.lng, now, now],
    });

    // Wipe existing services for idempotency
    await db.execute({ sql: "DELETE FROM Service WHERE funeralHomeId = ?", args: [hd.id] });

    for (const s of services) {
      await db.execute({
        sql: `INSERT INTO Service (id, funeralHomeId, category, name, price, priceMin, priceMax, description, createdAt)
              VALUES (?,?,?,?,?,?,?,?,?)`,
        args: [cuid(), hd.id, s.category, s.name, s.price, null, null, null, now],
      });
    }

    console.log(`✓ ${hd.name}`);
  }

  console.log("Done.");
}

main().catch(console.error);
