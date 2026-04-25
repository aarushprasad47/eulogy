/**
 * Scrapes contact pages of funeral homes with websites but no email address.
 * Extracts any email addresses found and updates the DB.
 * Run: npx tsx --env-file=.env.local scripts/extract-emails.ts
 */

import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const CONCURRENCY = 5;
const DELAY_MS = 500;
const TIMEOUT_MS = 8000;

const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

// Domains to skip (generic/not funeral home email)
const SKIP_DOMAINS = new Set([
  "example.com", "sentry.io", "w3.org", "schema.org",
  "google.com", "facebook.com", "twitter.com", "instagram.com",
  "youtube.com", "yelp.com", "apple.com", "microsoft.com",
  "cloudflare.com", "jquery.com", "wordpress.com",
]);

function extractEmails(html: string): string[] {
  const matches = html.match(EMAIL_RE) || [];
  return matches.filter(email => {
    const domain = email.split("@")[1]?.toLowerCase();
    if (!domain) return false;
    if (SKIP_DOMAINS.has(domain)) return false;
    if (domain.endsWith(".png") || domain.endsWith(".jpg") || domain.endsWith(".gif")) return false;
    return true;
  });
}

async function fetchEmails(baseUrl: string): Promise<string | null> {
  const normalized = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`;

  // Try homepage first, then contact page
  const urls = [
    normalized,
    normalized.replace(/\/$/, "") + "/contact",
    normalized.replace(/\/$/, "") + "/contact-us",
    normalized.replace(/\/$/, "") + "/about",
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; EulogyBot/1.0; +https://eulogy-nu.vercel.app)",
          "Accept": "text/html",
        },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        redirect: "follow",
      });
      if (!res.ok) continue;
      const html = await res.text();
      const emails = extractEmails(html);
      if (emails.length > 0) {
        // Prefer non-noreply emails, prefer shorter domain matches
        const clean = emails.find(e => !e.startsWith("noreply") && !e.startsWith("no-reply")) || emails[0];
        return clean.toLowerCase().trim().slice(0, 200);
      }
    } catch {
      // continue to next URL
    }
  }
  return null;
}

async function main() {
  const args = process.argv.slice(2);
  const limit = parseInt(args[0] || "1000");

  const rows = await db.execute({
    sql: `SELECT id, website, name FROM FuneralHome
          WHERE website IS NOT NULL AND email IS NULL
          LIMIT ?`,
    args: [limit],
  });

  const homes = rows.rows as unknown as { id: string; website: string; name: string }[];
  console.log(`Extracting emails from ${homes.length} homes...\n`);

  let found = 0;
  let attempted = 0;

  for (let i = 0; i < homes.length; i += CONCURRENCY) {
    const batch = homes.slice(i, i + CONCURRENCY);

    await Promise.allSettled(
      batch.map(async (h) => {
        const email = await fetchEmails(h.website);
        attempted++;
        if (email) {
          await db.execute({
            sql: "UPDATE FuneralHome SET email=?, updatedAt=? WHERE id=?",
            args: [email, new Date().toISOString(), h.id],
          });
          found++;
          process.stdout.write(`  ✓ ${h.name.slice(0, 40)}: ${email}\n`);
        }
      })
    );

    const pct = Math.round((attempted / homes.length) * 100);
    process.stdout.write(`\rProgress: ${attempted}/${homes.length} (${pct}%) | Found: ${found}  `);

    if (i + CONCURRENCY < homes.length) {
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }

  console.log(`\n\nDone! Extracted ${found} email addresses from ${attempted} sites.`);

  const totals = await db.execute(`
    SELECT
      COUNT(*) as total,
      COUNT(email) as withEmail
    FROM FuneralHome
  `);
  const t = totals.rows[0];
  console.log(`DB totals: ${t.total} homes, ${t.withEmail} with email addresses.`);
}

main().catch(console.error);
