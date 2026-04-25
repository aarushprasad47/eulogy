import path from "path";
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrisma(): PrismaClient {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  let adapter: PrismaLibSql;

  if (tursoUrl) {
    // Remote Turso (production + dev with .env.local)
    adapter = new PrismaLibSql({ url: tursoUrl, authToken: tursoToken });
  } else {
    // Fallback: local SQLite file
    const dbPath = path.resolve(process.cwd(), "dev.db");
    adapter = new PrismaLibSql({ url: `file:${dbPath}` });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new PrismaClient({ adapter } as any);
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
