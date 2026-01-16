import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

// Vercel /tmp strategy for SQLite
// In production (Vercel), we MUST copy the DB to /tmp because the source task var is read-only.
const dbName = "dev.db";

const prismaClientSingleton = () => {
    if (process.env.NODE_ENV === "production") {
        // PRODUCTION STRATEGY
        try {
            const dbPath = path.join(process.cwd(), "prisma", dbName);
            const tmpDbPath = path.join("/tmp", dbName);

            // 1. Check if DB exists in source
            if (fs.existsSync(dbPath)) {
                // 2. Copy to /tmp if not already there (or always overwrite to ensure fresh demo data on cold start)
                // For a demo, resetting to fresh state on every cold start is actually a FEATURE.
                try {
                    fs.copyFileSync(dbPath, tmpDbPath);
                    console.log(`[DB] Copied database from ${dbPath} to ${tmpDbPath}`);
                } catch (e: any) {
                    console.error(`[DB] Failed to copy db: ${e.message}`);
                }
            } else {
                console.error(`[DB] Source database not found at ${dbPath}`);
            }

            // 3. Initialize Prisma with /tmp path
            return new PrismaClient({
                datasources: {
                    db: {
                        url: `file:${tmpDbPath}`
                    }
                }
            });
        } catch (error) {
            console.error("[DB] Initialization error:", error);
            return new PrismaClient();
        }
    } else {
        // DEVELOPMENT STRATEGY
        return new PrismaClient();
    }
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
