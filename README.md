# Eulogy — Funeral Price Transparency

> Compassionate care when it matters most.

Eulogy is a funeral price transparency platform that helps grieving families compare funeral home costs before making decisions. Under the FTC Funeral Rule, every funeral home in the US is legally required to provide a General Price List on request — but most families never see those prices until they're already sitting across from a funeral director. Eulogy collects, parses, and publishes real pricing data so families can compare with dignity, on their own time.

**Live:** [eulogy.vercel.app](https://eulogy.vercel.app)

---

## Features

### Search & Browse
Search funeral homes by city, state, or ZIP code. Results are ranked by data richness (most pricing info first) and display key prices at a glance.

### Explore Map
Interactive map of all funeral homes with verified pricing data. Hover or click a pin to preview services and prices. Powered by Leaflet with server-side rendering disabled for hydration safety.

### Side-by-Side Compare
Select up to 4 funeral homes and compare their full price lists in a table. The cheapest price per service category is highlighted in green.

### Funeral Home Detail Pages
Full price breakdown for each home, grouped by service category (cremation, embalming, transfer, casket, etc.). Shows a data source badge indicating whether prices were self-reported, web-scraped, or received via GPL email request.

### AI Chat Assistant
Conversational assistant powered by Groq's Llama 3.3. Detects location from the conversation, queries the database for local homes, and gives pricing guidance with real numbers. Supports multi-turn context.

### GPL Email Pipeline
Sends formal General Price List request emails to funeral homes citing the FTC Funeral Rule. When a funeral home replies with a PDF attachment, the system automatically parses it — extracting every service and price via regex — and adds the data to the database. A confirmation email is sent to the funeral home on successful ingestion.

### Self-Submit (Funeral Home Registration)
Funeral homes can submit their own price lists directly through a web form. Addresses are geocoded on submission via OpenStreetMap Nominatim so the home appears on the explore map immediately.

### Web Scraper
Scrapes funeral home websites for pricing data using three strategies: HTML price tables, definition lists, and inline dollar amounts with funeral-keyword filtering. Only writes to the database if at least one service is found.

### Agentverse Agent (FetchAI)
A Python uAgent registered on [agentverse.ai](https://agentverse.ai). Accepts structured `FuneralSearchRequest` messages from any agent on the network (location, budget, service type), queries MongoDB for matching homes, and returns real pricing data with a Gemini-powered recommendation. Discoverable via ASI:One.

**Agent address:** `agent1qdwew995wh8l9456p7uuvw9mjxzcy7ze09v74m3kdf8898c4yva9uzaz6ju`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, React Server Components) |
| Language | TypeScript (frontend/backend), Python 3.11 (agent) |
| Database | MongoDB Atlas (embedded services array per home) |
| DB Driver | Native `mongodb` npm driver (Prisma 7 dropped MongoDB support) |
| Type generation | Prisma 7 (schema → TypeScript types only, no runtime queries) |
| AI — Chat | Groq API (`llama-3.3-70b-versatile`) |
| AI — Agent | Google Gemini (`gemini-1.5-flash-8b` → `1.5-flash` → `2.0-flash` → Groq fallback) |
| Agent framework | FetchAI uAgents 0.22.5 |
| Email sending | Nodemailer + Gmail SMTP |
| Email receiving | ImapFlow (IMAP) + mailparser |
| PDF parsing | pdf-parse + regex price extraction |
| Web scraping | Cheerio |
| Geocoding | Nominatim (OpenStreetMap) |
| Map | Leaflet (dynamic import, SSR disabled) |
| Deployment | Vercel (auto-deploy on push to `main`) |
| Styling | Tailwind CSS + CSS custom properties |

---

## How Pricing Data Gets In

```
1. Seed          scripts/seed-mongo.ts      10 LA-area homes, hardcoded with real prices
2. Web scraper   scripts/scrape-batch.ts    Cheerio scrape of funeral home websites
3. GPL email     scripts/pipeline-test.ts   Email → PDF reply → regex parse → MongoDB
4. Self-submit   /register → /api/homes     Funeral home fills out the web form
```

All four paths write to the same `FuneralHome` collection in MongoDB Atlas. Every feature (search, map, compare, chat, Agentverse agent) reads from that single source.

---

## Project Structure

```
app/
  page.tsx               Homepage with search
  explore/page.tsx       Interactive map
  compare/page.tsx       Side-by-side price table
  chat/page.tsx          AI chat assistant
  homes/[id]/page.tsx    Individual funeral home detail
  register/page.tsx      Funeral home self-submission form
  api/
    chat/route.ts        Groq streaming chat endpoint
    homes/route.ts       CRUD + geocoding on create
    email-bot/route.ts   Trigger GPL email request
    scraper/route.ts     Trigger web scrape for a single home

lib/
  prisma.ts              MongoDB data layer (Prisma-compatible API)
  email-bot.ts           Nodemailer email builder
  scraper.ts             Cheerio scraper

agent/
  eulogy_agent.py        FetchAI uAgent (Agentverse)
  requirements.txt       Python dependencies (uagents, pymongo, google-genai, groq)

scripts/
  seed-mongo.ts          Seed 10 LA funeral homes into MongoDB
  scrape-batch.ts        Batch scrape all homes with websites
  pipeline-test.ts       One-shot GPL email send + reply scanner
  check-replies.ts       Watch-mode GPL reply processor
```

---

## Running Locally

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env.local

# Run dev server
npm run dev
```

### Running the Agentverse Agent

```bash
cd agent
python3.11 -m venv venv
venv/bin/pip install -r requirements.txt
venv/bin/python eulogy_agent.py
```

Requires Python 3.11 (uAgents is incompatible with 3.12+).

---
