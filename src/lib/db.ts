import { PrismaClient } from "../generated/client_v2";
import path from "path";
import fs from "fs";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

// Vercel /tmp strategy for SQLite
const dbName = "dev.db";
const dbPath = path.join(process.cwd(), "prisma", dbName);
const tmpDbPath = path.join("/tmp", dbName);

const prismaClientSingleton = () => {
    if (process.env.NODE_ENV === "production") {
        try {
            // Attempt to find the DB file in potential locations (Vercel paths can vary)
            // Priority: 1. standard path 2. current dir
            let sourcePath = dbPath;
            if (!fs.existsSync(sourcePath)) {
                // Fallback try root
                sourcePath = path.join(process.cwd(), dbName);
            }

            if (fs.existsSync(sourcePath)) {
                // Only copy if not exists or force fresh copy? 
                // For demo read-only, fresh copy is safer to reset state if needed
                // But efficient lambda sharing might prefer existence check.
                // Let's copy if not exists to be safe and fast.
                if (!fs.existsSync(tmpDbPath)) {
                    fs.copyFileSync(sourcePath, tmpDbPath);
                    console.log(`[DB] Copied database from ${sourcePath} to ${tmpDbPath}`);
                } else {
                    console.log(`[DB] Using existing database at ${tmpDbPath}`);
                }
            } else {
                console.error(`[DB] Source database not found at ${sourcePath} or ${dbPath}`);
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
            // Fallback to default which might fail but better than crashing here
            return new PrismaClient();
        }
    }

    return new PrismaClient();
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
