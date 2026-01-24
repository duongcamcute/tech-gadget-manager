"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createLocation(data: { name: string; type: string; parentId?: string | null; icon?: string }) {
    try {
        const location = await prisma.location.create({
            data: {
                name: data.name,
                type: data.type,
                icon: data.icon,
                parentId: data.parentId || null,
            },
        });
        revalidatePath("/");
        return { success: true, location };
    } catch (error) {
        console.error("Failed to create location:", error);
        return { success: false, error: "Failed to create location" };
    }
}

export async function updateLocation(id: string, data: { name: string; type: string; parentId?: string | null; icon?: string }) {
    try {
        // Prevent setting parent to itself
        if (data.parentId === id) {
            return { success: false, error: "Cannot set location as its own parent" };
        }

        const location = await prisma.location.update({
            where: { id },
            data: {
                name: data.name,
                type: data.type,
                icon: data.icon,
                parentId: data.parentId || null,
            },
        });
        revalidatePath("/");
        return { success: true, location };
    } catch (error) {
        console.error("Failed to update location:", error);
        return { success: false, error: "Failed to update location" };
    }
}

export async function deleteLocation(id: string) {
    try {
        await prisma.location.delete({
            where: { id }
        });

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete location:", error);
        return { success: false, error: "Cannot delete location with items or children." };
    }
}

export async function getLocations() {
    const locations = await prisma.location.findMany({
        orderBy: { name: "asc" },
        include: { _count: { select: { items: true } } }
    });
    return locations;
}

export async function getLocationHierarchy() {
    const locations = await prisma.location.findMany({
        orderBy: { name: 'asc' },
        include: { _count: { select: { items: true } } }
    });

    const locationMap = new Map();
    const roots: any[] = [];

    locations.forEach(loc => {
        locationMap.set(loc.id, { ...loc, children: [] });
    });

    locations.forEach(loc => {
        if (loc.parentId) {
            const parent = locationMap.get(loc.parentId);
            if (parent) {
                parent.children.push(locationMap.get(loc.id));
            }
        } else {
            roots.push(locationMap.get(loc.id));
        }
    });

    return roots;
}

export async function getLocationItems(locationId: string) {
    try {
        const items = await prisma.item.findMany({
            where: { locationId },
            select: {
                id: true,
                name: true,
                image: true,
                status: true,
                brand: true,
                model: true,
                category: true,
                specs: true
            },
            orderBy: { name: 'asc' }
        });
        return items;
    } catch (e) {
        return [];
    }
}
