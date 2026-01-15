"use server";

import { prisma } from "@/lib/db";

export async function getItem(id: string) {
    return await prisma.item.findUnique({
        where: { id },
        include: { location: true },
    });
}
