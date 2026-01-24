"use server";

import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { ItemSchema, ItemFormData, TemplateSchema, TemplateData } from "@/types/schema";
import { revalidatePath } from "next/cache";

import { formatDateVN } from "@/lib/utils/date";
import { logActivity } from "@/lib/audit";
import { triggerWebhooks } from "@/lib/webhooks";
import { unlink } from "fs/promises";
import { join } from "path";
import { hashPassword, verifyPassword, createSession, deleteSession, requireAuth } from "@/lib/auth";

export async function createItem(data: ItemFormData) {
    // 1. Auth Check
    await requireAuth();

    const result = ItemSchema.safeParse(data);
    if (!result.success) return { success: false, error: result.error.message };

    // --- DEMO MODE CHECK ---
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
        return { success: false, error: "Chế độ Demo: Tính năng Tạo mới bị khóa." };
    }
    // -----------------------

    try {
        const { purchaseDate, locationId, specs, borrowerName, dueDate, borrowDate, purchasePrice, ...rest } = result.data;
        const dbPurchaseDate = purchaseDate ? new Date(purchaseDate) : null;
        const dbPurchasePrice = purchasePrice ? parseFloat(purchasePrice.toString()) : null;
        const dbLocationId = (locationId && locationId !== "") ? locationId : null;
        const dbSpecs = specs ? JSON.stringify(specs) : "{}";

        // Location lookup
        let locName = "Kho chưa phân loại";
        if (dbLocationId) {
            const l = await prisma.location.findUnique({ where: { id: dbLocationId } });
            if (l) locName = l.name;
        }

        // Transactions
        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // Auto-save Brand
            if (rest.brand) {
                try { await tx.brand.upsert({ where: { name: rest.brand }, update: {}, create: { name: rest.brand } }); } catch (e) { }
            }

            const item = await tx.item.create({
                data: {
                    ...rest,
                    // Enforce required string fields for DB
                    type: rest.type || "Other",
                    category: rest.category || "General",
                    locationId: dbLocationId,
                    purchaseDate: dbPurchaseDate,
                    purchasePrice: dbPurchasePrice,
                    specs: dbSpecs,
                    history: {
                        create: {
                            action: "CREATED",
                            details: `Nhập kho vào ${formatDateVN(new Date())} tại ${locName}`
                        }
                    }
                }
            });

            // If Lent
            if (rest.status === 'Lent') {
                if (!borrowerName || borrowerName.trim() === '') {
                    throw new Error("Vui lòng nhập tên người mượn");
                }

                // Auto-save Contact
                try { await tx.contact.upsert({ where: { name: borrowerName }, update: {}, create: { name: borrowerName } }); } catch (e) { }

                const bDate = borrowDate ? new Date(borrowDate) : new Date();

                await tx.lendingRecord.create({
                    data: {
                        itemId: item.id,
                        borrowerName: borrowerName,
                        borrowDate: bDate,
                        dueDate: dueDate ? new Date(dueDate) : null
                    }
                });
                await tx.itemHistory.create({
                    data: {
                        itemId: item.id,
                        action: "LENT",
                        details: `Cho ${borrowerName} mượn từ ngày ${formatDateVN(bDate)}`
                    }
                });
            }
        });

        // --- POST-ACTION SIDE EFFECTS (Non-blocking) ---
        const newItem = await prisma.item.findFirst({ orderBy: { createdAt: 'desc' }, select: { id: true, name: true } });
        if (newItem) {
            await logActivity({
                action: "CREATE",
                entityType: "ITEM",
                entityId: newItem.id,
                entityName: newItem.name,
                details: `Tạo mới thiết bị: ${newItem.name} tại ${locName}`
            });
            await triggerWebhooks("item.created", { ...rest, id: newItem.id, name: newItem.name });

            if (rest.status === 'Lent') {
                await logActivity({
                    action: "LEND",
                    entityType: "ITEM",
                    entityId: newItem.id,
                    entityName: newItem.name,
                    details: `Cho ${borrowerName} mượn ngay khi tạo`
                });
                await triggerWebhooks("item.lent", { itemId: newItem.id, borrowerName, borrowDate: new Date() });
            }
        }
        // -----------------------------------------------

        revalidatePath("/");
        return { success: true };
    } catch (error: any) {
        console.error("CREATE ERROR:", error);
        return { success: false, error: "Lỗi lưu dữ liệu: " + (error.message || "") };
    }
}

export async function updateItem(id: string, data: ItemFormData) {
    // 1. Auth Check
    await requireAuth();

    const result = ItemSchema.safeParse(data);
    if (!result.success) return { success: false, error: result.error.message };

    // --- DEMO MODE CHECK ---
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
        return { success: false, error: "Chế độ Demo: Tính năng Cập nhật bị khóa." };
    }
    // -----------------------

    try {
        const { purchaseDate, locationId, specs, borrowerName, dueDate, borrowDate, purchasePrice, ...rest } = result.data;
        const dbPurchaseDate = purchaseDate ? new Date(purchaseDate) : null;
        const dbPurchasePrice = purchasePrice ? parseFloat(purchasePrice.toString()) : null;
        const dbLocationId = (locationId && locationId !== "") ? locationId : null;
        const dbSpecs = specs ? JSON.stringify(specs) : "{}";

        const oldItem = await prisma.item.findUnique({ where: { id }, include: { location: true } });
        if (!oldItem) return { success: false, error: "Không tìm thấy" };

        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // Auto-save Brand
            if (rest.brand) {
                try { await tx.brand.upsert({ where: { name: rest.brand }, update: {}, create: { name: rest.brand } }); } catch (e) { }
            }

            // Update Base Item
            await tx.item.update({
                where: { id },
                data: {
                    ...rest,
                    type: rest.type || oldItem.type, // fallback to old
                    category: rest.category || oldItem.category,
                    locationId: dbLocationId,
                    purchaseDate: dbPurchaseDate,
                    purchasePrice: dbPurchasePrice,
                    specs: dbSpecs
                }
            });

            // 1. Detect Location Change
            if (oldItem.locationId !== dbLocationId) {
                const newLoc = dbLocationId ? await tx.location.findUnique({ where: { id: dbLocationId } }) : null;
                const oldLocName = oldItem.location?.name || "Kho cũ";
                const newLocName = newLoc?.name || "Kho chưa phân loại";

                await tx.itemHistory.create({
                    data: {
                        itemId: id,
                        action: "MOVED",
                        details: `Chuyển từ [${oldLocName}] sang [${newLocName}] vào ngày ${formatDateVN(new Date())}`
                    }
                });
            }

            // 2. Detect Lending (Available/InUse -> Lent)
            if (rest.status === 'Lent' && oldItem.status !== 'Lent') {
                if (!borrowerName || borrowerName.trim() === '') {
                    throw new Error("Vui lòng nhập tên người mượn");
                }
                const name = borrowerName || "Ai đó";
                // Auto-save Contact
                try { await tx.contact.upsert({ where: { name: name }, update: {}, create: { name: name } }); } catch (e) { }

                const bDate = borrowDate ? new Date(borrowDate) : new Date();

                await tx.lendingRecord.create({
                    data: {
                        itemId: id,
                        borrowerName: name,
                        borrowDate: bDate,
                        dueDate: dueDate ? new Date(dueDate) : null
                    }
                });
                await tx.itemHistory.create({
                    data: {
                        itemId: id,
                        action: "LENT",
                        details: `Cho ${name} mượn từ ngày ${formatDateVN(bDate)}`
                    }
                });
            }

            // 3. Detect Return (Lent -> Available/InUse)
            if (oldItem.status === 'Lent' && rest.status !== 'Lent') {
                const storedLoc = dbLocationId ? await tx.location.findUnique({ where: { id: dbLocationId } }) : null;
                const locName = storedLoc?.name || "Kho";

                // FIX: Cập nhật returnDate cho LendingRecord đang active
                const activeRecord = await tx.lendingRecord.findFirst({
                    where: { itemId: id, returnDate: null }
                });
                if (activeRecord) {
                    await tx.lendingRecord.update({
                        where: { id: activeRecord.id },
                        data: { returnDate: new Date() }
                    });
                }

                await tx.itemHistory.create({
                    data: {
                        itemId: id,
                        action: "RETURNED",
                        details: `Đã được trả lại vào ${locName}`
                    }
                });
            }
        });

        // --- POST-ACTION SIDE EFFECTS ---
        const updatedItem = await prisma.item.findUnique({ where: { id }, select: { name: true } });
        await logActivity({
            action: "UPDATE",
            entityType: "ITEM",
            entityId: id,
            entityName: updatedItem?.name || "Unknown Item",
            details: "Cập nhật thông tin thiết bị"
        });
        await triggerWebhooks("item.updated", { id, changes: rest });

        // Check for specific events based on logic above
        // Note: Since we are outside transaction, precise diff is harder, but we can infer from inputs
        if (data.locationId && data.locationId !== oldItem.locationId) {
            await triggerWebhooks("item.moved", { id, from: oldItem.locationId, to: data.locationId });
        }
        if (data.status === 'Lent' && oldItem.status !== 'Lent') {
            await triggerWebhooks("item.lent", { id, borrowerName });
        }
        if (oldItem.status === 'Lent' && data.status !== 'Lent') {
            await logActivity({
                action: "RETURN",
                entityType: "ITEM",
                entityId: id,
                entityName: updatedItem?.name || "Unknown Item",
                details: "Đã trả lại thiết bị"
            });
            await triggerWebhooks("item.returned", { id });
        }
        // ------------------------------

        revalidatePath("/");
        return { success: true };
    } catch (error: any) {
        console.error("UPDATE ERROR:", error);
        return { success: false, error: "Lỗi cập nhật: " + error.message };
    }
}

export async function deleteItem(id: string) {
    // Auth Check
    await requireAuth();

    // --- DEMO MODE CHECK ---
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
        return { success: false, error: "Chế độ Demo: Tính năng Xóa bị khóa." };
    }
    // -----------------------
    try {
        // 1. Get attachments to delete files
        const attachments = await prisma.attachment.findMany({ where: { itemId: id } });

        // 2. Delete database record (Cascades to history, attachments DB records)
        const item = await prisma.item.findUnique({ where: { id }, select: { name: true } });
        await prisma.item.delete({ where: { id } });

        // 3. Cleanup files from disk (Fire and forget or await)
        for (const file of attachments) {
            try {
                const filePath = join(process.cwd(), "public", file.url); // url is relative usually? Check upload logic
                // upload logic: /uploads/attachments/...
                // So join(process.cwd(), "public", file.url) is correct if url starts with /uploads
                await unlink(filePath);
            } catch (e) {
                console.error(`Failed to delete file: ${file.url}`, e);
            }
        }

        // 4. Log & Webhook
        await logActivity({
            action: "DELETE",
            entityType: "ITEM",
            entityId: id,
            entityName: item?.name || "Unknown",
            details: "Đã xóa thiết bị vĩnh viễn"
        });
        await triggerWebhooks("item.deleted", { id, name: item?.name });
        revalidatePath("/");
        return { success: true };
    } catch (e) {
        return { success: false, error: "Không thể xóa" };
    }
}

export async function getItem(id: string) {
    return await prisma.item.findUnique({
        where: { id },
        include: {
            location: true,
            history: { orderBy: { timestamp: 'desc' }, take: 20 },
            lendingRecords: { orderBy: { borrowDate: 'desc' }, take: 5 }
        },
    });
}

export async function getAllItems() {
    return await prisma.item.findMany({
        include: { location: true },
        orderBy: { updatedAt: 'desc' }
    });
}


export async function bulkMoveItems(ids: string[], locationId: string | null) {
    await requireAuth();
    // --- DEMO MODE CHECK ---
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
        return { success: false, error: "Chế độ Demo: Tính năng Di chuyển hàng loạt bị khóa." };
    }
    // -----------------------
    try {
        const dbLocationId = (locationId && locationId !== "") ? locationId : null;

        let locName = "Kho chưa phân loại";
        if (dbLocationId) {
            const l = await prisma.location.findUnique({ where: { id: dbLocationId } });
            if (l) locName = l.name;
        }

        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // Update all items
            await tx.item.updateMany({
                where: { id: { in: ids } },
                data: { locationId: dbLocationId }
            });

            // Add history for each
            for (const id of ids) {
                await tx.itemHistory.create({
                    data: {
                        itemId: id,
                        action: "MOVED",
                        details: `Chuyển hàng loạt đến [${locName}] vào ngày ${formatDateVN(new Date())}`
                    }
                });
            }
        });

        // --- LOGGING ---
        await logActivity({
            action: "MOVE",
            entityType: "ITEM",
            entityId: null,
            entityName: `Batch ${ids.length} items`,
            details: `Di chuyển ${ids.length} thiết bị sang ${locName}`
        });
        ids.forEach(id => {
            triggerWebhooks("item.moved", { id, to: dbLocationId });
        });
        // --------------

        revalidatePath("/");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: "Lỗi chuyển kho hàng loạt: " + e.message };
    }
}

export async function bulkDeleteItems(ids: string[]) {
    await requireAuth();
    // --- DEMO MODE CHECK ---
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
        return { success: false, error: "Chế độ Demo: Tính năng Xóa hàng loạt bị khóa." };
    }
    // -----------------------
    try {
        // 1. Get all attachments for these items
        const attachments = await prisma.attachment.findMany({ where: { itemId: { in: ids } } });

        // 2. Delete
        await prisma.item.deleteMany({
            where: { id: { in: ids } }
        });

        // 3. Cleanup files
        // We do this concurrently for speed
        Promise.allSettled(attachments.map(async (file) => {
            try {
                await unlink(join(process.cwd(), "public", file.url));
            } catch (e) { /* ignore missing files */ }
        }));

        // 4. Log
        await logActivity({
            action: "DELETE",
            entityType: "ITEM",
            entityId: null,
            entityName: `Batch ${ids.length} items`,
            details: `Xóa hàng loạt ${ids.length} thiết bị`
        });
        ids.forEach(id => {
            triggerWebhooks("item.deleted", { id });
        });
        revalidatePath("/");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: "Lỗi xóa hàng loạt: " + e.message };
    }
}


export async function getBrands() {
    return await prisma.brand.findMany({ orderBy: { name: 'asc' } });
}


export async function getContacts() {
    return await prisma.contact.findMany({ orderBy: { name: 'asc' } });
}

// --- Auth & Settings Actions ---

export async function loginUser(username: string, pass: string) {
    // Ensure default admin exists ONLY if database is empty
    if (username === 'admin' && process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') {
        const userCount = await prisma.user.count();
        if (userCount === 0) {
            const hashedAdmin = await hashPassword('admin');
            await prisma.user.create({
                data: {
                    username: 'admin',
                    password: hashedAdmin,
                    fullName: 'Administrator',
                    theme: 'default',
                    colors: null
                }
            });
        }
    }

    // Security Check: If logging in as 'admin' with default password check logic
    if (username === 'admin' && pass === 'admin') {
        const otherUsersCount = await prisma.user.count({
            where: { username: { not: 'admin' } }
        });
        if (otherUsersCount > 0) {
            // Check if admin password is still default (plain or hash of 'admin')
            const adminUser = await prisma.user.findUnique({ where: { username: 'admin' } });
            if (adminUser) {
                const isDefault = adminUser.password === 'admin' || await verifyPassword('admin', adminUser.password);
                if (isDefault) {
                    return { success: false, error: "Tài khoản admin mặc định đã bị vô hiệu hóa an toàn." };
                }
            }
        }
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return { success: false, error: "Người dùng không tồn tại" };

    // --- SECURE PASSWORD CHECK (With Auto-Migration) ---
    let isValid = await verifyPassword(pass, user.password);

    if (!isValid) {
        // Fallback: Check if stored password is raw plaintext (Legacy/Migration support)
        if (user.password === pass) {
            isValid = true;
            // Auto-migrate to hash for security improvement
            console.log(`Migrating password for user ${username} to hash...`);
            const hashed = await hashPassword(pass);
            await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
        }
    }

    if (!isValid) {
        return { success: false, error: "Sai mật khẩu" };
    }
    // ---------------------------------------------------

    // Create Session Cookie
    await createSession(user.id, user.username);

    return {
        success: true,
        user: {
            id: user.id,
            username: user.username,
            fullName: user.fullName || user.username,
            theme: user.theme,
            colors: user.colors,
            avatar: user.avatar ?? null
        }
    };
}

export async function logoutAction() {
    await deleteSession();
    return { success: true };
}

export async function updateUserProfile(id: string, newUsername: string, newPass: string, newFullName?: string, newAvatar?: string) {
    await requireAuth();
    // --- DEMO MODE CHECK ---
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
        return { success: false, error: "Chế độ Demo: Tính năng Cập nhật hồ sơ bị khóa." };
    }
    // -----------------------
    try {
        const data: Prisma.UserUpdateInput = { username: newUsername };
        if (newPass && newPass.trim() !== '') {
            data.password = await hashPassword(newPass);
        }
        if (newFullName) data.fullName = newFullName;
        if (newAvatar) data.avatar = newAvatar;

        // Check for existing username
        const existingUser = await prisma.user.findUnique({ where: { username: newUsername } });
        if (existingUser && existingUser.id !== id) {
            return { success: false, error: "Tên đăng nhập đã được sử dụng" };
        }

        const updated = await prisma.user.update({
            where: { id },
            data
        });

        return {
            success: true,
            user: {
                ...updated,
                fullName: updated.fullName || updated.username,
                colors: updated.colors ?? null,
                avatar: updated.avatar ?? null
            }
        };
    } catch (e: any) {
        return { success: false, error: "Lỗi cập nhật: " + e.message };
    }
}

export async function saveThemeSettings(id: string, theme: string, colors: string) {
    await requireAuth();
    // --- DEMO MODE CHECK ---
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
        return { success: false, error: "Chế độ Demo: Tính năng Lưu giao diện bị khóa." };
    }
    // -----------------------
    try {
        await prisma.user.update({
            where: { id },
            data: { theme, colors }
        });
        return { success: true };
    } catch (e: any) {
        return { success: false, error: "Lỗi lưu cài đặt" };
    }
}

export async function addBrandAction(name: string) {
    await requireAuth();
    // --- DEMO MODE CHECK ---
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
        return { success: false, error: "Chế độ Demo: Tính năng Thêm hãng bị khóa." };
    }
    // -----------------------
    try {
        await prisma.brand.create({ data: { name } });
        revalidatePath("/");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: "Hãng đã tồn tại hoặc lỗi khác" };
    }
}

export async function createTemplate(data: TemplateData) {
    await requireAuth();
    // --- DEMO MODE CHECK ---
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
        return { success: false, error: "Chế độ Demo: Tính năng Tạo mẫu bị khóa." };
    }
    // -----------------------
    const result = TemplateSchema.safeParse(data);
    if (!result.success) return { success: false, error: result.error.message };

    try {
        await prisma.template.create({
            data: {
                name: result.data.name,
                category: result.data.category || "General",
                config: result.data.config
            }
        });
        revalidatePath("/");
        revalidatePath("/settings");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: "Lỗi tạo mẫu: " + e.message };
    }
}

export async function getTemplates() {
    return await prisma.template.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function deleteTemplate(id: string) {
    await requireAuth();
    // --- DEMO MODE CHECK ---
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
        return { success: false, error: "Chế độ Demo: Tính năng Xóa mẫu bị khóa." };
    }
    // -----------------------
    try {
        await prisma.template.delete({ where: { id } });
        revalidatePath("/");
        revalidatePath("/settings");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: "Lỗi xóa mẫu" };
    }
}

// --- SYSTEM Backup & Restore Actions ---

export async function exportDatabase() {
    await requireAuth();
    try {
        // Lấy users nhưng loại bỏ password để bảo mật
        const usersRaw = await prisma.user.findMany();
        const usersSafe = usersRaw.map(({ password, ...rest }) => rest);

        const data = {
            items: await prisma.item.findMany(),
            itemHistory: await prisma.itemHistory.findMany(),
            locations: await prisma.location.findMany(),
            lendingRecords: await prisma.lendingRecord.findMany(),
            templates: await prisma.template.findMany(),
            contacts: await prisma.contact.findMany(),
            brands: await prisma.brand.findMany(),
            users: usersSafe,  // Không chứa password
            version: "1.0",
            exportedAt: new Date().toISOString()
        };
        return { success: true, data: JSON.stringify(data, null, 2) };
    } catch (e: any) {
        return { success: false, error: "Lỗi xuất dữ liệu: " + e.message };
    }
}

export async function importDatabase(jsonString: string, clearExisting = false) {
    await requireAuth();
    // --- DEMO MODE CHECK ---
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
        return { success: false, error: "Chế độ Demo: Tính năng Nhập dữ liệu bị khóa." };
    }
    // -----------------------
    try {
        const data = JSON.parse(jsonString);
        if (!data.version) throw new Error("File không hợp lệ");

        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            if (clearExisting) {
                // Delete everything in reverse order of dependency
                await tx.itemHistory.deleteMany();
                await tx.lendingRecord.deleteMany();
                await tx.item.deleteMany();
                await tx.location.deleteMany();
                await tx.template.deleteMany();
                await tx.contact.deleteMany();
                await tx.brand.deleteMany();
                // We typically don't delete Users to prevent lockout
            }

            // Restore Locations
            if (data.locations?.length) {
                for (const loc of data.locations) {
                    await tx.location.upsert({ where: { id: loc.id }, update: { ...loc }, create: { ...loc } });
                }
            }

            // Restore Brands & Contacts
            if (data.brands?.length) {
                for (const b of data.brands) {
                    await tx.brand.upsert({ where: { id: b.id }, update: b, create: b });
                }
            }
            if (data.contacts?.length) {
                for (const c of data.contacts) {
                    await tx.contact.upsert({ where: { id: c.id }, update: c, create: c });
                }
            }

            // Restore Items
            if (data.items?.length) {
                for (const item of data.items) {
                    await tx.item.upsert({ where: { id: item.id }, update: item, create: item });
                }
            }

            // Restore History & Lending
            if (data.itemHistory?.length) {
                for (const h of data.itemHistory) {
                    // Check if item exists to avoid FK error
                    const exists = await tx.item.findUnique({ where: { id: h.itemId } });
                    if (exists) await tx.itemHistory.upsert({ where: { id: h.id }, update: h, create: h });
                }
            }
            if (data.lendingRecords?.length) {
                for (const l of data.lendingRecords) {
                    const exists = await tx.item.findUnique({ where: { id: l.itemId } });
                    if (exists) await tx.lendingRecord.upsert({ where: { id: l.id }, update: l, create: l });
                }
            }

            // Restore Templates
            if (data.templates?.length) {
                for (const t of data.templates) {
                    await tx.template.upsert({ where: { id: t.id }, update: t, create: t });
                }
            }
        });

        revalidatePath("/");
        return { success: true };
    } catch (e: any) {
        console.error("IMPORT ERROR", e);
        return { success: false, error: "Lỗi nhập dữ liệu: " + e.message };
    }
}

// --- API Key Management ---

export async function generateApiKey(name: string) {
    await requireAuth();
    // --- DEMO MODE CHECK ---
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
        return { success: false, error: "Chế độ Demo: Tính năng Tạo API Key bị khóa." };
    }
    // -----------------------
    try {
        const key = 'tgm_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const record = await prisma.apiKey.create({
            data: { name, key }
        });
        revalidatePath("/settings");
        return { success: true, key: record.key };
    } catch (e: any) {
        return { success: false, error: "Lỗi tạo khóa: " + e.message };
    }
}

export async function revokeApiKey(id: string) {
    await requireAuth();
    // --- DEMO MODE CHECK ---
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
        return { success: false, error: "Chế độ Demo: Tính năng Xóa API Key bị khóa." };
    }
    // -----------------------
    try {
        await prisma.apiKey.delete({ where: { id } });
        revalidatePath("/settings");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: "Lỗi xóa khóa" };
    }
}

export async function getApiKeys() {
    return await prisma.apiKey.findMany({ orderBy: { createdAt: 'desc' } });
}

// --- Item History Management ---

export async function deleteItemHistory(historyId: string) {
    await requireAuth();
    // --- DEMO MODE CHECK ---
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
        return { success: false, error: "Chế độ Demo: Tính năng Xóa lịch sử bị khóa." };
    }
    // -----------------------
    try {
        await prisma.itemHistory.delete({ where: { id: historyId } });
        revalidatePath("/");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: "Lỗi xóa lịch sử: " + e.message };
    }
}

// --- Item Type Management ---

export async function getItemTypes() {
    return await prisma.itemType.findMany({ orderBy: { order: 'asc' } });
}

export async function createItemType(value: string, label: string) {
    await requireAuth();
    // --- DEMO MODE CHECK ---
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
        return { success: false, error: "Chế độ Demo: Tính năng Thêm loại thiết bị bị khóa." };
    }
    // -----------------------
    try {
        // Simple approach: count existing items for order
        const existingCount = await prisma.itemType.count();
        const newOrder = existingCount + 1;

        await prisma.itemType.create({
            data: { value, label, order: newOrder }
        });
        revalidatePath("/settings");
        return { success: true };
    } catch (e: any) {
        console.error("CREATE ITEM TYPE ERROR:", e);
        if (e.code === 'P2002') {
            return { success: false, error: "Mã loại này đã tồn tại" };
        }
        // Check if it's a Prisma model not found error
        if (e.message?.includes('itemType') || e.message?.includes('undefined')) {
            return { success: false, error: "Vui lòng restart server: npx prisma generate && npm run dev" };
        }
        return { success: false, error: "Lỗi tạo loại thiết bị: " + e.message };
    }
}

export async function deleteItemType(id: string) {
    await requireAuth();
    // --- DEMO MODE CHECK ---
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
        return { success: false, error: "Chế độ Demo: Tính năng Xóa loại thiết bị bị khóa." };
    }
    // -----------------------
    try {
        await prisma.itemType.delete({ where: { id } });
        revalidatePath("/settings");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: "Lỗi xóa loại thiết bị: " + e.message };
    }
}
