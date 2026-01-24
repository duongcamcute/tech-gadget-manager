import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// API Key validation helper
async function validateApiKey(request: NextRequest): Promise<{ valid: boolean; keyId?: string }> {
    const apiKeyHeader = request.headers.get("X-API-Key");
    const authHeader = request.headers.get("Authorization");

    const token = apiKeyHeader || (authHeader?.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : null);

    if (!token) return { valid: false };

    try {
        const apiKey = await prisma.apiKey.findUnique({ where: { key: token } });
        if (!apiKey) return { valid: false };

        await prisma.apiKey.update({
            where: { id: apiKey.id },
            data: { lastUsed: new Date() }
        });

        return { valid: true, keyId: apiKey.id };
    } catch {
        return { valid: false };
    }
}

// GET /api/v1/items/[id] - Get single item
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await validateApiKey(request);
    if (!auth.valid) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const item = await prisma.item.findUnique({
            where: { id },
            include: {
                location: { select: { id: true, name: true, type: true } },
                lendingRecords: {
                    orderBy: { borrowDate: "desc" },
                    take: 10,
                },
                history: {
                    orderBy: { timestamp: "desc" },
                    take: 20,
                }
            }
        });

        if (!item) {
            return NextResponse.json({ error: "Item not found" }, { status: 404 });
        }

        return NextResponse.json({ item });
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PUT /api/v1/items/[id] - Update item
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await validateApiKey(request);
    if (!auth.valid) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await request.json();

        // Check if item exists
        const existing = await prisma.item.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: "Item not found" }, { status: 404 });
        }

        const item = await prisma.item.update({
            where: { id },
            data: {
                ...(body.name && { name: body.name }),
                ...(body.type && { type: body.type }),
                ...(body.category && { category: body.category }),
                ...(body.specs && { specs: typeof body.specs === "object" ? JSON.stringify(body.specs) : body.specs }),
                ...(body.status && { status: body.status }),
                ...(body.brand !== undefined && { brand: body.brand }),
                ...(body.model !== undefined && { model: body.model }),
                ...(body.color !== undefined && { color: body.color }),
                ...(body.serialNumber !== undefined && { serialNumber: body.serialNumber }),
                ...(body.purchaseDate !== undefined && { purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null }),
                ...(body.warrantyEnd !== undefined && { warrantyEnd: body.warrantyEnd ? new Date(body.warrantyEnd) : null }),
                ...(body.purchaseLocation !== undefined && { purchaseLocation: body.purchaseLocation }),
                ...(body.purchaseUrl !== undefined && { purchaseUrl: body.purchaseUrl }),
                ...(body.purchasePrice !== undefined && { purchasePrice: body.purchasePrice }),
                ...(body.notes !== undefined && { notes: body.notes }),
                ...(body.image !== undefined && { image: body.image }),
                ...(body.locationId !== undefined && { locationId: body.locationId }),
            }
        });

        return NextResponse.json({ item });
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE /api/v1/items/[id] - Delete item
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await validateApiKey(request);
    if (!auth.valid) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const existing = await prisma.item.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: "Item not found" }, { status: 404 });
        }

        await prisma.item.delete({ where: { id } });

        return NextResponse.json({ success: true, message: "Item deleted" });
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
