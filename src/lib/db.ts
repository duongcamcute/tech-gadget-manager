import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

const prismaClientSingleton = () => {
    // CASE 1: DATABASE_URL is set (Docker / External DB)
    // Use Prisma's default behavior which reads from env var
    if (process.env.DATABASE_URL) {
        console.log("[DB] Using DATABASE_URL from environment");
        return new PrismaClient();
    }

    // CASE 2: Production without DATABASE_URL (Vercel /tmp strategy)
    if (process.env.NODE_ENV === "production") {
        try {
            const dbName = "dev.db";
            const dbPath = path.join(process.cwd(), "prisma", dbName);
            const tmpDbPath = path.join("/tmp", dbName);

            if (fs.existsSync(dbPath)) {
                try {
                    fs.copyFileSync(dbPath, tmpDbPath);
                    console.log("[DB] Copied to /tmp for Vercel");
                } catch (e: any) {
                    console.error(`[DB] Failed to copy db: ${e.message}`);
                }
            } else {
                console.error(`[DB] Source database not found at ${dbPath}`);
            }

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
    }

    // CASE 3: Development
    console.log("[DB] Development mode");
    return new PrismaClient();
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

