import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

const prismaClientSingleton = () => {
    // CASE 1: DATABASE_URL is set (Docker / External DB) - ALWAYS preferred
    if (process.env.DATABASE_URL) {
        console.log("[DB] Using DATABASE_URL from environment");
        return new PrismaClient();
    }

    // CASE 2: Production WITHOUT DATABASE_URL = ERROR
    // This prevents accidentally using dev.db in production
    if (process.env.NODE_ENV === "production") {
        console.error("[DB] ⛔ CRITICAL ERROR: DATABASE_URL is required in production!");
        console.error("[DB] Please set DATABASE_URL environment variable.");
        console.error("[DB] Example: DATABASE_URL=file:/app/db/prod.db");
        throw new Error("DATABASE_URL is required in production environment. Set it in docker-compose.yml or environment variables.");
    }

    // CASE 3: Development - use default from schema.prisma (prisma/dev.db)
    console.log("[DB] Development mode - using default database");
    return new PrismaClient();
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

