"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { formatDateVN } from "@/lib/utils/date";

export async function lendItem(itemId: string, borrowerName: string, dueDate?: Date) {
    try {
        await prisma.$transaction(async (tx) => {
            // Auto-save Contact
            try { await tx.contact.upsert({ where: { name: borrowerName }, update: {}, create: { name: borrowerName } }); } catch (e) { }

            const now = new Date();

            // Create lending record
            await tx.lendingRecord.create({
                data: {
                    itemId,
                    borrowerName,
                    borrowDate: now,
                    dueDate: dueDate || null
                }
            });

            // Update item status
            await tx.item.update({
                where: { id: itemId },
                data: { status: 'Lent', locationId: null }
            });

            // Log History
            await tx.itemHistory.create({
                data: {
                    itemId,
                    action: "LENT",
                    details: `Cho ${borrowerName} mượn từ ngày ${formatDateVN(now)}`
                }
            });
        });

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Lend error:", error);
        return { success: false, error: "Failed to lend item" };
    }
}

export async function bulkLendItems(itemIds: string[], borrowerName: string, dueDate?: Date) {
    try {
        await prisma.$transaction(async (tx) => {
            // Auto-save Contact
            try { await tx.contact.upsert({ where: { name: borrowerName }, update: {}, create: { name: borrowerName } }); } catch (e) { }

            const now = new Date();

            for (const itemId of itemIds) {
                // Create lending record
                await tx.lendingRecord.create({
                    data: {
                        itemId,
                        borrowerName,
                        borrowDate: now,
                        dueDate: dueDate || null
                    }
                });

                // Update item status
                await tx.item.update({
                    where: { id: itemId },
                    data: { status: 'Lent', locationId: null }
                });

                // Log History
                await tx.itemHistory.create({
                    data: {
                        itemId,
                        action: "LENT",
                        details: `Cho ${borrowerName} mượn (hàng loạt) từ ngày ${formatDateVN(now)}`
                    }
                });
            }
        });

        revalidatePath("/");
        return { success: true };
    } catch (error: any) {
        console.error("Bulk lend error:", error);
        return { success: false, error: "Lỗi cho mượn hàng loạt: " + error.message };
    }
}


export async function returnItem(itemId: string) {
    try {
        await prisma.$transaction(async (tx) => {
            const now = new Date();

            // Find active record
            const record = await tx.lendingRecord.findFirst({
                where: { itemId, returnDate: null }
            });

            if (record) {
                await tx.lendingRecord.update({
                    where: { id: record.id },
                    data: { returnDate: now }
                });
            }

            // Update item status
            const item = await tx.item.update({
                where: { id: itemId },
                data: { status: 'Available' }
            });

            // Log History
            // Try to find location name for context
            let locName = "Kho";
            if (item.locationId) {
                const l = await tx.location.findUnique({ where: { id: item.locationId } });
                if (l) locName = l.name;
            }

            await tx.itemHistory.create({
                data: {
                    itemId,
                    action: "RETURNED",
                    details: `Đã được trả lại vào ${locName} (${formatDateVN(now)})`
                }
            });
        });

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to return item" };
    }
}
