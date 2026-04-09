import 'server-only';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

/**
 * Prisma client initialization using Prisma 7 Pg Adapter.
 * This resolves the "engine type client" error by explicitly providing a database adapter.
 */

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const createPrismaClient = () => {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("❌ DATABASE_URL is not defined in environment variables!");
    }

    const maskedUrl = databaseUrl.replace(/:([^@]+)@/, ":****@");
    console.log(`🔌 Initializing Prisma with Pg Adapter. URL: ${maskedUrl}`);

    const pool = new pg.Pool({ connectionString: databaseUrl });
    const adapter = new PrismaPg(pool);

    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
  } catch (error) {
    console.error("❌ Prisma Client Initialization Error:", error);
    throw error;
  }
};

export const db = globalThis.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalThis.prisma = db;

