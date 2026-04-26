/**
 * MongoDB-backed data layer.
 * Exported as `prisma` with the same call signature consumers already use,
 * so no other file needs to change.
 *
 * FuneralHome documents embed their services array.
 * GplRequest and ScraperJob live in their own collections.
 */

import { MongoClient } from "mongodb";
import type { PrismaClient } from "@/app/generated/prisma/client";

// ─── connection singleton ───────────────────────────────────────────────────

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is not set");

const G = globalThis as unknown as { _mongo?: MongoClient };
if (!G._mongo) G._mongo = new MongoClient(uri);
const client = G._mongo;

function col(name: string) {
  return client.db().collection(name);
}

// ─── tiny ID generator ──────────────────────────────────────────────────────

function mkid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 11);
}

// ─── helpers ────────────────────────────────────────────────────────────────

/** Map _id → id and ensure services is always an array */
function toHome(doc: any, svcOpts?: any): any {
  if (!doc) return null;
  const { _id, services: rawSvcs = [], ...rest } = doc;
  const services = applyServiceOpts(rawSvcs, svcOpts);
  return { id: String(_id), ...rest, services };
}

function applyServiceOpts(svcs: any[], opts: any): any[] {
  if (opts === false || opts === undefined) return [];
  if (!svcs) return [];
  let s = svcs.map((sv: any) => {
    const { _id, ...r } = sv;
    return { id: sv.id ?? String(_id), ...r };
  });
  if (opts && opts !== true) {
    if (opts.where?.category) s = s.filter((x: any) => x.category === opts.where.category);
    if (opts.orderBy?.price) {
      const d = opts.orderBy.price === "asc" ? 1 : -1;
      s.sort((a: any, b: any) => d * ((a.price ?? a.priceMin ?? 1e9) - (b.price ?? b.priceMin ?? 1e9)));
    }
    if (opts.orderBy?.category) {
      const d = opts.orderBy.category === "asc" ? 1 : -1;
      s.sort((a: any, b: any) => d * a.category.localeCompare(b.category));
    }
    if (opts.take) s = s.slice(0, opts.take);
  }
  return s;
}

/** Build a MongoDB filter from a Prisma-style where object */
function toFilter(where: any): any {
  if (!where) return {};
  const f: any = {};

  // id equality or $in
  if (where.id !== undefined) {
    if (typeof where.id === "string") {
      f._id = where.id;
    } else if (where.id?.in) {
      f._id = { $in: where.id.in };
    }
  }

  // OR array
  if (where.OR) {
    f.$or = where.OR.map((cond: any) => {
      const c: any = {};
      for (const [k, v] of Object.entries(cond)) {
        if (v == null) continue;
        if (k === "id") { c._id = v; continue; }
        if (typeof v === "string") { c[k] = v; continue; }
        const vv = v as any;
        if (vv.contains != null) c[k] = { $regex: vv.contains, $options: "i" };
        else if (vv.equals != null) c[k] = vv.equals;
      }
      return c;
    }).filter((c: any) => Object.keys(c).length > 0);
    if (f.$or.length === 0) delete f.$or;
  }

  // services: { some: {} }  → has at least one service
  if (where.services?.some !== undefined) {
    f["services.0"] = { $exists: true };
  }

  // lat / lng not null
  if (where.lat?.not === null) f.lat = { $ne: null, $exists: true };
  if (where.lng?.not === null) f.lng = { $ne: null, $exists: true };

  // funeralHomeId
  if (where.funeralHomeId !== undefined) f.funeralHomeId = where.funeralHomeId;

  // status: string or { in: [...] }
  if (where.status !== undefined) {
    if (typeof where.status === "string") f.status = where.status;
    else if (where.status?.in) f.status = { $in: where.status.in };
    else if (where.status?.equals) f.status = where.status.equals;
  }

  // emailSentAt: { gte: Date }
  if (where.emailSentAt?.gte) f.emailSentAt = { $gte: where.emailSentAt.gte };

  // scalar fields (name, city, state, zip, url, …)
  const SKIP = new Set(["id", "OR", "AND", "NOT", "services", "lat", "lng", "funeralHomeId", "status", "emailSentAt"]);
  for (const [k, v] of Object.entries(where)) {
    if (SKIP.has(k) || v == null) continue;
    if (typeof v === "string") { f[k] = v; continue; }
    if (typeof v === "boolean") { f[k] = v; continue; }
    const vv = v as any;
    if (vv.contains != null) f[k] = { $regex: vv.contains, $options: "i" };
    else if (vv.equals != null) f[k] = vv.equals;
    else if (vv.not === null) f[k] = { $ne: null };
    else if (vv.gte != null) f[k] = { $gte: vv.gte };
    else if (vv.in) f[k] = { $in: vv.in };
  }

  return f;
}

/** Build a MongoDB sort from Prisma-style orderBy */
function toSort(orderBy: any): any {
  if (!orderBy) return {};
  const src = Array.isArray(orderBy) ? orderBy : [orderBy];
  const s: any = {};
  for (const o of src) {
    for (const [k, v] of Object.entries(o)) {
      if (k === "services") continue; // handled in JS
      s[k] = v === "asc" ? 1 : -1;
    }
  }
  return s;
}

function needsServiceCountSort(orderBy: any): boolean {
  if (!orderBy) return false;
  return (Array.isArray(orderBy) ? orderBy : [orderBy]).some((o: any) => o.services);
}

// ─── FuneralHome ─────────────────────────────────────────────────────────────

const funeralHome = {
  async findMany(opts: any = {}): Promise<any[]> {
    await client.connect();
    const filter = toFilter(opts.where);
    const sort = toSort(opts.orderBy);
    const limit = opts.take ? opts.take * 3 : 500; // over-fetch for JS sort

    let docs = await col("FuneralHome").find(filter).sort(sort).limit(limit).toArray();

    // JS sort for services._count
    if (needsServiceCountSort(opts.orderBy)) {
      const nameDir = (Array.isArray(opts.orderBy) ? opts.orderBy : [opts.orderBy])
        .find((o: any) => o.name)?.name === "asc" ? 1 : -1;
      docs.sort((a: any, b: any) => {
        const diff = (b.services?.length ?? 0) - (a.services?.length ?? 0);
        return diff !== 0 ? diff : nameDir * a.name.localeCompare(b.name);
      });
    }

    if (opts.take) docs = docs.slice(0, opts.take);

    const svcOpts = opts.include?.services ?? (opts.select ? false : true);
    return docs.map((d: any) => toHome(d, svcOpts));
  },

  async findFirst(opts: any = {}): Promise<any | null> {
    await client.connect();
    const doc = await col("FuneralHome").findOne(toFilter(opts.where));
    return toHome(doc, opts.include?.services ?? true);
  },

  async findUnique(opts: any): Promise<any | null> {
    await client.connect();
    const id = opts.where?.id;
    const filter = id ? { _id: id } : toFilter(opts.where);
    const doc = await col("FuneralHome").findOne(filter);
    return toHome(doc, opts.include?.services ?? true);
  },

  async create(opts: any): Promise<any> {
    await client.connect();
    const { services: svcIn, id, ...rest } = opts.data ?? {};
    const now = new Date();
    const homeId = id ?? mkid();
    const services = (svcIn?.create ?? []).map((s: any) => ({
      id: mkid(),
      funeralHomeId: homeId,
      category: s.category,
      name: s.name,
      price: s.price ?? null,
      priceMin: s.priceMin ?? null,
      priceMax: s.priceMax ?? null,
      description: s.description ?? null,
      createdAt: now,
    }));
    const doc = { _id: homeId, ...rest, services, createdAt: now, updatedAt: now };
    await col("FuneralHome").insertOne(doc as any);
    return toHome(doc, opts.include?.services ?? true);
  },

  async update(opts: any): Promise<any> {
    await client.connect();
    const id = opts.where?.id;
    const now = new Date();
    await col("FuneralHome").updateOne({ _id: id }, { $set: { ...opts.data, updatedAt: now } });
    const doc = await col("FuneralHome").findOne({ _id: id });
    return toHome(doc, opts.include?.services ?? true);
  },

  async updateMany(opts: any): Promise<{ count: number }> {
    await client.connect();
    const result = await col("FuneralHome").updateMany(
      toFilter(opts.where),
      { $set: { ...opts.data, updatedAt: new Date() } }
    );
    return { count: result.modifiedCount };
  },
};

// ─── Service (embedded, accessed via push into FuneralHome.services) ─────────

const service = {
  async create(opts: any): Promise<any> {
    await client.connect();
    const { funeralHomeId, ...rest } = opts.data ?? {};
    const now = new Date();
    const svc = {
      id: mkid(),
      funeralHomeId,
      price: null,
      priceMin: null,
      priceMax: null,
      description: null,
      ...rest,
      createdAt: now,
    };
    await col("FuneralHome").updateOne(
      { _id: funeralHomeId },
      { $push: { services: svc } as any, $set: { updatedAt: now } }
    );
    return svc;
  },
};

// ─── ScraperJob ───────────────────────────────────────────────────────────────

const scraperJob = {
  async create(opts: any): Promise<any> {
    await client.connect();
    const now = new Date();
    const doc = { _id: mkid(), ...opts.data, createdAt: now };
    await col("ScraperJob").insertOne(doc as any);
    return { id: doc._id, ...opts.data, createdAt: now };
  },

  async update(opts: any): Promise<any> {
    await client.connect();
    const id = opts.where?.id;
    await col("ScraperJob").updateOne({ _id: id }, { $set: opts.data });
    const doc = await col("ScraperJob").findOne({ _id: id });
    return doc ? { id: String(doc._id), ...doc } : null;
  },
};

// ─── GplRequest ──────────────────────────────────────────────────────────────

const gplRequest = {
  async findFirst(opts: any = {}): Promise<any | null> {
    await client.connect();
    const doc = await col("GplRequest").findOne(toFilter(opts.where));
    return doc ? { id: String(doc._id), ...doc } : null;
  },

  async create(opts: any): Promise<any> {
    await client.connect();
    const now = new Date();
    const doc = { _id: mkid(), ...opts.data, createdAt: now };
    await col("GplRequest").insertOne(doc as any);
    return { id: doc._id, ...opts.data, createdAt: now };
  },

  async update(opts: any): Promise<any> {
    await client.connect();
    const id = opts.where?.id;
    await col("GplRequest").updateOne({ _id: id }, { $set: opts.data });
    const doc = await col("GplRequest").findOne({ _id: id });
    return doc ? { id: String(doc._id), ...doc } : null;
  },
};

// ─── export ─────────────────────────────────────────────────────────────────

// Cast to PrismaClient so all consumer files keep their existing TypeScript types
export const prisma = {
  funeralHome,
  service,
  scraperJob,
  gplRequest,
  $disconnect: async () => { /* MongoClient stays open for reuse */ },
} as unknown as PrismaClient;
