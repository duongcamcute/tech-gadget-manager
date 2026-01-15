
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
    const apiKey = req.headers.get("X-API-Key");

    if (!apiKey) {
        return NextResponse.json({ error: "Missing API Key" }, { status: 401 });
    }

    const validKey = await prisma.apiKey.findUnique({ where: { key: apiKey } });
    if (!validKey) {
        return NextResponse.json({ error: "Invalid API Key" }, { status: 403 });
    }

    // Update last used
    await prisma.apiKey.update({
        where: { id: validKey.id },
        data: { lastUsed: new Date() }
    });

    const items = await prisma.item.findMany({
        include: {
            location: true,
            lendingRecords: { where: { returnDate: null } }
        }
    });

    return NextResponse.json({ count: items.length, items });
}
