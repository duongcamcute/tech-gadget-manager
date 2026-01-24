"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { formatDateVN } from "@/lib/utils/date";
import { logActivity } from "@/lib/audit";
import { triggerWebhooks } from "@/lib/webhooks";
import { requireAuth } from "@/lib/auth";

export async function lendItem(itemId: string, borrowerName: string, dueDate?: Date) {
    // Auth Check
    await requireAuth();

    // --- DEMO MODE CHECK ---
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
        return { success: false, error: "Chế độ Demo: Tính năng Cho mượn bị khóa." };
    }
    // -----------------------
    try {
        await prisma.$transaction(async (tx) => {
            if (!borrowerName || borrowerName.trim() === '') {
                throw new Error("Tên người mượn không được để trống");
            }

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

        // --- SIDE EFFECTS ---
        const item = await prisma.item.findUnique({ where: { id: itemId }, select: { name: true } });
        await logActivity({
            action: "LEND",
            entityType: "ITEM",
            entityId: itemId,
            entityName: item?.name,
            details: `Cho ${borrowerName} mượn`
        });
        await triggerWebhooks("item.lent", { itemId, borrowerName, dueDate });
        // --------------------

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Lend error:", error);
        return { success: false, error: "Failed to lend item" };
    }
}

export async function bulkLendItems(itemIds: string[], borrowerName: string, dueDate?: Date) {
    // Auth Check
    await requireAuth();

    // --- DEMO MODE CHECK ---
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
        return { success: false, error: "Chế độ Demo: Tính năng Cho mượn hàng loạt bị khóa." };
    }
    // -----------------------
    try {
        await prisma.$transaction(async (tx: any) => {
            if (!borrowerName || borrowerName.trim() === '') {
                throw new Error("Tên người mượn không được để trống");
            }

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

        // --- SIDE EFFECTS ---
        await logActivity({
            action: "LEND",
            entityType: "ITEM",
            entityId: null,
            entityName: `Batch ${itemIds.length} items`,
            details: `Cho ${borrowerName} mượn ${itemIds.length} thiết bị`
        });
        itemIds.forEach(id => {
            triggerWebhooks("item.lent", { itemId: id, borrowerName, dueDate });
        });
        // --------------------

        revalidatePath("/");
        return { success: true };
    } catch (error: any) {
        console.error("Bulk lend error:", error);
        return { success: false, error: "Lỗi cho mượn hàng loạt: " + error.message };
    }
}


export async function returnItem(itemId: string) {
    // Auth Check
    await requireAuth();

    // --- DEMO MODE CHECK ---
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
        return { success: false, error: "Chế độ Demo: Tính năng Trả đồ bị khóa." };
    }
    // -----------------------
    try {
        await prisma.$transaction(async (tx: any) => {
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

            // Update item status to Available and Location to NULL (Unsorted)
            const item = await tx.item.update({
                where: { id: itemId },
                data: { status: 'Available', locationId: null }
            });

            // Log History
            await tx.itemHistory.create({
                data: {
                    itemId,
                    action: "RETURNED",
                    details: `Đã được trả lại vào Kho chưa phân loại (${formatDateVN(now)})`
                }
            });
        });

        // --- SIDE EFFECTS ---
        const item = await prisma.item.findUnique({ where: { id: itemId }, select: { name: true } });
        await logActivity({
            action: "RETURN",
            entityType: "ITEM",
            entityId: itemId,
            entityName: item?.name,
            details: `Đã trả lại thiết bị`
        });
        await triggerWebhooks("item.returned", { itemId });
        // --------------------

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to return item" };
    }
}
