import * as cheerio from "cheerio";

export interface ScrapedService {
  name: string;
  price: number | null;
  priceMin: number | null;
  priceMax: number | null;
  category: string;
  description: string;
}

export interface ScrapedFuneralHome {
  name: string | null;
  phone: string | null;
  address: string | null;
  services: ScrapedService[];
}

function extractPrice(text: string): { price: number | null; min: number | null; max: number | null } {
  const rangeMatch = text.match(/\$([0-9,]+)\s*[-–]\s*\$([0-9,]+)/);
  if (rangeMatch) {
    return {
      price: null,
      min: parseFloat(rangeMatch[1].replace(/,/g, "")),
      max: parseFloat(rangeMatch[2].replace(/,/g, "")),
    };
  }
  const singleMatch = text.match(/\$([0-9,]+(?:\.[0-9]{2})?)/);
  if (singleMatch) {
    return { price: parseFloat(singleMatch[1].replace(/,/g, "")), min: null, max: null };
  }
  return { price: null, min: null, max: null };
}

function guessCategory(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("basic service")) return "BASIC_SERVICES";
  if (lower.includes("direct cremation") || lower.includes("cremation")) return "DIRECT_CREMATION";
  if (lower.includes("immediate burial")) return "IMMEDIATE_BURIAL";
  if (lower.includes("forward")) return "FORWARDING_REMAINS";
  if (lower.includes("receiving")) return "RECEIVING_REMAINS";
  if (lower.includes("full funeral") || lower.includes("traditional funeral")) return "FULL_FUNERAL_SERVICE";
  if (lower.includes("graveside")) return "GRAVESIDE_SERVICE";
  if (lower.includes("transfer")) return "TRANSFER_OF_REMAINS";
  if (lower.includes("embalm")) return "EMBALMING";
  if (lower.includes("preparation") || lower.includes("dressing")) return "BODY_PREPARATION";
  if (lower.includes("viewing") || lower.includes("visitation")) return "VIEWING_FACILITIES";
  if (lower.includes("hearse")) return "HEARSE";
  if (lower.includes("limo")) return "LIMOUSINE";
  if (lower.includes("casket") || lower.includes("coffin")) return "CASKET";
  if (lower.includes("urn")) return "URN";
  if (lower.includes("burial container") || lower.includes("vault") || lower.includes("liner")) return "OUTER_BURIAL_CONTAINER";
  if (lower.includes("monument") || lower.includes("marker")) return "MONUMENT";
  return "OTHER";
}

export async function scrapeUrl(url: string): Promise<ScrapedFuneralHome> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; EulogyBot/1.0; funeral price transparency)" },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const html = await res.text();
  const $ = cheerio.load(html);

  const result: ScrapedFuneralHome = {
    name: $("title").first().text().trim() || null,
    phone: null,
    address: null,
    services: [],
  };

  // Extract phone
  const bodyText = $("body").text();
  const phoneMatch = bodyText.match(/\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/);
  if (phoneMatch) result.phone = phoneMatch[0];

  // Look for price tables
  $("table").each((_, table) => {
    const rows = $(table).find("tr");
    rows.each((_, row) => {
      const cells = $(row).find("td, th");
      if (cells.length >= 2) {
        const nameText = $(cells[0]).text().trim();
        const priceText = $(cells[cells.length - 1]).text().trim();
        if (nameText && priceText.includes("$")) {
          const { price, min, max } = extractPrice(priceText);
          result.services.push({
            name: nameText,
            price,
            priceMin: min,
            priceMax: max,
            category: guessCategory(nameText),
            description: "",
          });
        }
      }
    });
  });

  // Look for price lists with dollar signs
  $("li, p, div").each((_, el) => {
    const text = $(el).text().trim();
    if (text.includes("$") && text.length < 300) {
      const { price, min, max } = extractPrice(text);
      if (price || min) {
        // Clean up: remove child element text
        const name = text.replace(/\$[\d,.\s–-]+/g, "").trim().slice(0, 100);
        if (name.length > 3) {
          result.services.push({
            name,
            price,
            priceMin: min,
            priceMax: max,
            category: guessCategory(name),
            description: "",
          });
        }
      }
    }
  });

  // Deduplicate by name
  const seen = new Set<string>();
  result.services = result.services.filter((s) => {
    if (seen.has(s.name)) return false;
    seen.add(s.name);
    return true;
  });

  return result;
}
