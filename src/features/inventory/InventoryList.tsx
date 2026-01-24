import { prisma } from "@/lib/db";
import InventoryManager from "./InventoryManager";
import { getLocations } from "@/features/location/actions";

export async function InventoryList() {
    const [rawItems, locations] = await Promise.all([
        prisma.item.findMany({
            orderBy: { createdAt: 'desc' },
            take: 200,
            include: {
                location: true,
                history: { orderBy: { timestamp: 'desc' }, take: 5 },
                lendingRecords: {
                    where: { returnDate: null }, // Chỉ lấy records đang active (chưa trả)
                    orderBy: { borrowDate: 'desc' },
                    take: 1
                }
            }
        }),
        getLocations()
    ]);

    const items = rawItems.map(item => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        purchaseDate: item.purchaseDate ? item.purchaseDate.toISOString() : null,
        warrantyEnd: item.warrantyEnd ? item.warrantyEnd.toISOString() : null,
        location: item.location ? { ...item.location } : null,
        history: item.history.map(h => ({ ...h, timestamp: h.timestamp.toISOString() })),
        // Thêm thông tin lending cho UI
        activeLending: item.lendingRecords[0] ? {
            borrowerName: item.lendingRecords[0].borrowerName,
            borrowDate: item.lendingRecords[0].borrowDate.toISOString(),
            dueDate: item.lendingRecords[0].dueDate ? item.lendingRecords[0].dueDate.toISOString() : null
        } : null
    }));

    return <InventoryManager initialItems={items} locations={locations} />;
}
