import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

const prismaClientSingleton = () => {
    // CASE 1: DATABASE_URL is set (Docker / External DB) - ALWAYS preferred
    if (process.env.DATABASE_URL) {
        console.log("[DB] Using DATABASE_URL from environment");
        return new PrismaClient();
    }

    // CASE 2: Production WITHOUT DATABASE_URL
    // We do NOT want to copy dev.db here to avoid data loss issues.
    // If DATABASE_URL is missing, we log a warning but still return a client.
    // Prisma will throw an error at RUNTIME if it tries to connect without a URL, which is what we want.
    // This allows 'next build' to pass (which might not need DB connection) but fails safely at runtime.
    if (process.env.NODE_ENV === "production") {
        console.warn("[DB] ⚠️ WARNING: DATABASE_URL is not set in production.");
        console.warn("[DB] This is okay during build time, but will fail at runtime.");

        // Return a client without explicit datasources. 
        // It will try to use env("DATABASE_URL") by default, or fail if missing.
        return new PrismaClient();
    }

    // CASE 3: Development - use default from schema.prisma (prisma/dev.db)
    console.log("[DB] Development mode - using default database");
    return new PrismaClient();
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

