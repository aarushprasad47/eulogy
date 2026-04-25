// Run: npx tsx --env-file=.env.local scripts/seed-la.ts
import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

interface HomeData {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  website: string;
  services: { category: string; name: string; price?: number; priceMin?: number; priceMax?: number }[];
}

const LA_HOMES: HomeData[] = [
  {
    name: "Forest Lawn Memorial Parks",
    address: "1712 S Glendale Ave",
    city: "Glendale",
    state: "CA",
    zip: "91205",
    phone: "(800) 204-3131",
    website: "https://www.forestlawn.com",
    services: [
      { category: "BASIC_SERVICES", name: "Basic Services Fee", price: 2450 },
      { category: "DIRECT_CREMATION", name: "Direct Cremation", price: 2195 },
      { category: "FULL_FUNERAL_SERVICE", name: "Full Funeral Service with Burial", price: 9800 },
      { category: "EMBALMING", name: "Embalming", price: 875 },
      { category: "TRANSFER_OF_REMAINS", name: "Transfer of Remains", price: 525 },
      { category: "HEARSE", name: "Hearse", price: 495 },
      { category: "CASKET", name: "Casket (selection)", priceMin: 3500, priceMax: 14000 },
      { category: "URN", name: "Cremation Urn (selection)", priceMin: 295, priceMax: 2400 },
      { category: "VIEWING_FACILITIES", name: "Facilities for Viewing", price: 650 },
    ],
  },
  {
    name: "Hollywood Forever Cemetery",
    address: "6000 Santa Monica Blvd",
    city: "Los Angeles",
    state: "CA",
    zip: "90038",
    phone: "(323) 469-1181",
    website: "https://www.hollywoodforever.com",
    services: [
      { category: "BASIC_SERVICES", name: "Basic Services Fee", price: 1995 },
      { category: "DIRECT_CREMATION", name: "Direct Cremation", price: 1650 },
      { category: "FULL_FUNERAL_SERVICE", name: "Full Funeral Service", price: 7950 },
      { category: "EMBALMING", name: "Embalming", price: 695 },
      { category: "TRANSFER_OF_REMAINS", name: "Transfer of Remains", price: 450 },
      { category: "HEARSE", name: "Hearse", price: 425 },
      { category: "CASKET", name: "Casket (selection)", priceMin: 2200, priceMax: 9500 },
      { category: "URN", name: "Cremation Urn", priceMin: 195, priceMax: 1800 },
      { category: "GRAVESIDE_SERVICE", name: "Graveside Service", price: 750 },
    ],
  },
  {
    name: "Affordable Cremation & Burial",
    address: "2440 W Victory Blvd",
    city: "Burbank",
    state: "CA",
    zip: "91505",
    phone: "(818) 842-1717",
    website: "https://www.affordablecremationla.com",
    services: [
      { category: "BASIC_SERVICES", name: "Basic Services Fee", price: 695 },
      { category: "DIRECT_CREMATION", name: "Direct Cremation (no service)", price: 795 },
      { category: "DIRECT_CREMATION", name: "Cremation with Memorial Service", price: 1495 },
      { category: "IMMEDIATE_BURIAL", name: "Immediate Burial", price: 2950 },
      { category: "TRANSFER_OF_REMAINS", name: "Transfer of Remains", price: 295 },
      { category: "URN", name: "Basic Cremation Urn", priceMin: 95, priceMax: 495 },
      { category: "EMBALMING", name: "Embalming", price: 495 },
    ],
  },
  {
    name: "Pacific Funeral Service",
    address: "318 N Garfield Ave",
    city: "Monterey Park",
    state: "CA",
    zip: "91754",
    phone: "(626) 280-1688",
    website: "https://www.pacificfuneralservice.com",
    services: [
      { category: "BASIC_SERVICES", name: "Basic Services Fee", price: 1450 },
      { category: "DIRECT_CREMATION", name: "Direct Cremation", price: 1195 },
      { category: "FULL_FUNERAL_SERVICE", name: "Full Funeral Service", price: 6500 },
      { category: "EMBALMING", name: "Embalming", price: 595 },
      { category: "TRANSFER_OF_REMAINS", name: "Transfer of Remains", price: 375 },
      { category: "HEARSE", name: "Hearse", price: 385 },
      { category: "CASKET", name: "Casket (selection)", priceMin: 1800, priceMax: 7500 },
      { category: "VIEWING_FACILITIES", name: "Facilities for Viewing", price: 450 },
    ],
  },
  {
    name: "Dignidad Funeral Services",
    address: "4300 E Cesar Chavez Ave",
    city: "Los Angeles",
    state: "CA",
    zip: "90063",
    phone: "(323) 264-8900",
    website: "https://www.dignidadfuneral.com",
    services: [
      { category: "BASIC_SERVICES", name: "Basic Services Fee", price: 1250 },
      { category: "DIRECT_CREMATION", name: "Direct Cremation", price: 999 },
      { category: "FULL_FUNERAL_SERVICE", name: "Full Funeral Service", price: 5800 },
      { category: "EMBALMING", name: "Embalming", price: 550 },
      { category: "TRANSFER_OF_REMAINS", name: "Transfer of Remains", price: 325 },
      { category: "HEARSE", name: "Hearse", price: 350 },
      { category: "CASKET", name: "Casket (selection)", priceMin: 1500, priceMax: 6500 },
      { category: "URN", name: "Cremation Urn", priceMin: 125, priceMax: 950 },
    ],
  },
  {
    name: "Pierce Brothers Westwood Village Memorial Park",
    address: "1218 Glendon Ave",
    city: "Los Angeles",
    state: "CA",
    zip: "90024",
    phone: "(310) 474-1579",
    website: "https://www.dignitymemorial.com/funeral-homes/los-angeles-ca",
    services: [
      { category: "BASIC_SERVICES", name: "Basic Services Fee", price: 2200 },
      { category: "DIRECT_CREMATION", name: "Direct Cremation", price: 1895 },
      { category: "FULL_FUNERAL_SERVICE", name: "Full Funeral Service", price: 8500 },
      { category: "EMBALMING", name: "Embalming", price: 795 },
      { category: "TRANSFER_OF_REMAINS", name: "Transfer of Remains", price: 495 },
      { category: "HEARSE", name: "Hearse", price: 450 },
      { category: "CASKET", name: "Casket (selection)", priceMin: 2800, priceMax: 11000 },
      { category: "LIMOUSINE", name: "Limousine / Family Car", price: 395 },
    ],
  },
  {
    name: "Rose Hills Memorial Park & Mortuary",
    address: "3888 Workman Mill Rd",
    city: "Whittier",
    state: "CA",
    zip: "90601",
    phone: "(562) 699-0921",
    website: "https://www.rosehills.com",
    services: [
      { category: "BASIC_SERVICES", name: "Basic Services Fee", price: 1895 },
      { category: "DIRECT_CREMATION", name: "Direct Cremation", price: 1495 },
      { category: "FULL_FUNERAL_SERVICE", name: "Full Funeral Service", price: 7200 },
      { category: "EMBALMING", name: "Embalming", price: 695 },
      { category: "TRANSFER_OF_REMAINS", name: "Transfer of Remains", price: 425 },
      { category: "HEARSE", name: "Hearse", price: 420 },
      { category: "CASKET", name: "Casket (selection)", priceMin: 2000, priceMax: 9000 },
      { category: "URN", name: "Cremation Urn", priceMin: 175, priceMax: 1500 },
      { category: "OUTER_BURIAL_CONTAINER", name: "Burial Vault / Grave Liner", priceMin: 995, priceMax: 3500 },
    ],
  },
  {
    name: "South Bay Funeral Chapel",
    address: "920 N Sepulveda Blvd",
    city: "Manhattan Beach",
    state: "CA",
    zip: "90266",
    phone: "(310) 376-5222",
    website: "https://www.southbayfuneral.com",
    services: [
      { category: "BASIC_SERVICES", name: "Basic Services Fee", price: 1750 },
      { category: "DIRECT_CREMATION", name: "Direct Cremation", price: 1350 },
      { category: "FULL_FUNERAL_SERVICE", name: "Full Funeral Service", price: 6900 },
      { category: "EMBALMING", name: "Embalming", price: 625 },
      { category: "TRANSFER_OF_REMAINS", name: "Transfer of Remains", price: 395 },
      { category: "HEARSE", name: "Hearse", price: 400 },
      { category: "CASKET", name: "Casket (selection)", priceMin: 1900, priceMax: 8500 },
      { category: "VIEWING_FACILITIES", name: "Facilities for Viewing", price: 500 },
    ],
  },
  {
    name: "Angeles Abbey Memorial Park",
    address: "1515 E Compton Blvd",
    city: "Compton",
    state: "CA",
    zip: "90221",
    phone: "(310) 537-8383",
    website: "https://www.angelesabbey.com",
    services: [
      { category: "BASIC_SERVICES", name: "Basic Services Fee", price: 1100 },
      { category: "DIRECT_CREMATION", name: "Direct Cremation", price: 895 },
      { category: "FULL_FUNERAL_SERVICE", name: "Full Funeral Service", price: 5200 },
      { category: "EMBALMING", name: "Embalming", price: 495 },
      { category: "TRANSFER_OF_REMAINS", name: "Transfer of Remains", price: 295 },
      { category: "CASKET", name: "Casket (selection)", priceMin: 1400, priceMax: 5800 },
    ],
  },
  {
    name: "Eckols Funeral Home",
    address: "11961 Prairie Ave",
    city: "Hawthorne",
    state: "CA",
    zip: "90250",
    phone: "(310) 679-8943",
    website: "https://www.ecklofuneralhome.com",
    services: [
      { category: "BASIC_SERVICES", name: "Basic Services Fee", price: 1195 },
      { category: "DIRECT_CREMATION", name: "Direct Cremation", price: 950 },
      { category: "FULL_FUNERAL_SERVICE", name: "Full Funeral Service", price: 5600 },
      { category: "EMBALMING", name: "Embalming", price: 525 },
      { category: "TRANSFER_OF_REMAINS", name: "Transfer of Remains", price: 315 },
      { category: "HEARSE", name: "Hearse", price: 345 },
      { category: "CASKET", name: "Casket (selection)", priceMin: 1500, priceMax: 6200 },
    ],
  },
];

function randomId(): string {
  return Math.random().toString(36).slice(2, 11) + Math.random().toString(36).slice(2, 11);
}

async function seed() {
  console.log("Seeding LA funeral homes...");
  let homesAdded = 0;
  let servicesAdded = 0;

  for (const home of LA_HOMES) {
    // Check if already exists
    const existing = await db.execute({
      sql: "SELECT id FROM FuneralHome WHERE name = ? AND city = ?",
      args: [home.name, home.city],
    });

    let homeId: string;
    if (existing.rows.length > 0) {
      homeId = existing.rows[0].id as string;
      console.log(`  Skipping existing: ${home.name}`);
    } else {
      homeId = randomId();
      await db.execute({
        sql: `INSERT INTO FuneralHome (id, name, address, city, state, zip, phone, website, verified, dataSource, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'SELF_REPORTED', datetime('now'), datetime('now'))`,
        args: [homeId, home.name, home.address, home.city, home.state, home.zip, home.phone, home.website],
      });
      homesAdded++;
      console.log(`  Added: ${home.name} (${home.city})`);
    }

    // Insert services (skip if home was skipped)
    if (existing.rows.length === 0) {
      for (const svc of home.services) {
        const svcId = randomId();
        await db.execute({
          sql: `INSERT INTO Service (id, funeralHomeId, category, name, price, priceMin, priceMax, createdAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
          args: [
            svcId,
            homeId,
            svc.category,
            svc.name,
            svc.price ?? null,
            svc.priceMin ?? null,
            svc.priceMax ?? null,
          ],
        });
        servicesAdded++;
      }
    }
  }

  console.log(`\nDone! Added ${homesAdded} homes and ${servicesAdded} services.`);
  await db.close();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
