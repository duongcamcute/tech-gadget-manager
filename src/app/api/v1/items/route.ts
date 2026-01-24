import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// API Key validation helper - supports both X-API-Key header and Bearer token
async function validateApiKey(request: NextRequest): Promise<{ valid: boolean; keyId?: string }> {
    const apiKeyHeader = request.headers.get("X-API-Key");
    const authHeader = request.headers.get("Authorization");

    const token = apiKeyHeader || (authHeader?.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : null);

    if (!token) {
        return { valid: false };
    }

    try {
        const apiKey = await prisma.apiKey.findUnique({
            where: { key: token }
        });

        if (!apiKey) {
            return { valid: false };
        }

        // Update last used
        await prisma.apiKey.update({
            where: { id: apiKey.id },
            data: { lastUsed: new Date() }
        });

        return { valid: true, keyId: apiKey.id };
    } catch {
        return { valid: false };
    }
}

// GET /api/v1/items - List all items with pagination and filters
export async function GET(request: NextRequest) {
    const auth = await validateApiKey(request);
    if (!auth.valid) {
        return NextResponse.json({ error: "Unauthorized - Missing or invalid API Key" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
        const offset = parseInt(searchParams.get("offset") || "0");
        const status = searchParams.get("status");
        const category = searchParams.get("category");
        const brand = searchParams.get("brand");
        const search = searchParams.get("search");

        const where: any = {};
        if (status) where.status = status;
        if (category) where.category = category;
        if (brand) where.brand = brand;
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { model: { contains: search } },
                { serialNumber: { contains: search } },
            ];
        }

        const [items, total] = await Promise.all([
            prisma.item.findMany({
                where,
                take: limit,
                skip: offset,
                orderBy: { createdAt: "desc" },
                include: {
                    location: { select: { id: true, name: true } },
                    lendingRecords: {
                        where: { returnDate: null },
                        take: 1,
                        select: { borrowerName: true, borrowDate: true, dueDate: true }
                    }
                }
            }),
            prisma.item.count({ where })
        ]);

        return NextResponse.json({
            items: items.map(item => ({
                ...item,
                activeLending: item.lendingRecords[0] || null,
                lendingRecords: undefined,
            })),
            total,
            limit,
            offset,
        });
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/v1/items - Create new item
export async function POST(request: NextRequest) {
    const auth = await validateApiKey(request);
    if (!auth.valid) {
        return NextResponse.json({ error: "Unauthorized - Missing or invalid API Key" }, { status: 401 });
    }

    try {
        const body = await request.json();

        // Validate required fields
        if (!body.name || !body.type || !body.category) {
            return NextResponse.json({
                error: "Missing required fields: name, type, category"
            }, { status: 400 });
        }

        const item = await prisma.item.create({
            data: {
                name: body.name,
                type: body.type,
                category: body.category,
                specs: typeof body.specs === "object" ? JSON.stringify(body.specs) : body.specs || "{}",
                status: body.status || "Available",
                brand: body.brand,
                model: body.model,
                color: body.color,
                serialNumber: body.serialNumber,
                purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
                warrantyEnd: body.warrantyEnd ? new Date(body.warrantyEnd) : null,
                purchaseLocation: body.purchaseLocation,
                purchaseUrl: body.purchaseUrl,
                purchasePrice: body.purchasePrice,
                notes: body.notes,
                image: body.image,
                locationId: body.locationId,
            }
        });

        return NextResponse.json({ item }, { status: 201 });
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
