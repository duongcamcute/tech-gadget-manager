"use server";

import { prisma } from "@/lib/db";
import { ItemSchema, ItemFormData, TemplateSchema, TemplateData } from "@/types/schema";
import { revalidatePath } from "next/cache";

import { formatDateVN } from "@/lib/utils/date";

export async function createItem(data: ItemFormData) {
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
        const dbSpecs = JSON.stringify(specs);

        // Location lookup
        let locName = "Kho chưa phân loại";
        if (dbLocationId) {
            const l = await prisma.location.findUnique({ where: { id: dbLocationId } });
            if (l) locName = l.name;
        }

        // Transactions
        await prisma.$transaction(async (tx: any) => {
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

        revalidatePath("/");
        return { success: true };
    } catch (error: any) {
        console.error("CREATE ERROR:", error);
        return { success: false, error: "Lỗi lưu dữ liệu: " + (error.message || "") };
    }
}

export async function updateItem(id: string, data: ItemFormData) {
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
        // @ts-ignore
        const dbSpecs = JSON.stringify(specs);

        const oldItem = await prisma.item.findUnique({ where: { id }, include: { location: true } });
        if (!oldItem) return { success: false, error: "Không tìm thấy" };

        await prisma.$transaction(async (tx: any) => {
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

                await tx.itemHistory.create({
                    data: {
                        itemId: id,
                        action: "RETURNED",
                        details: `Đã được trả lại vào ${locName}`
                    }
                });
            }
        });

        revalidatePath("/");
        return { success: true };
    } catch (error: any) {
        console.error("UPDATE ERROR:", error);
        return { success: false, error: "Lỗi cập nhật: " + error.message };
    }
}

export async function deleteItem(id: string) {
    // --- DEMO MODE CHECK ---
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
        return { success: false, error: "Chế độ Demo: Tính năng Xóa bị khóa." };
    }
    // -----------------------
    try {
        await prisma.item.delete({ where: { id } });
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

        await prisma.$transaction(async (tx: any) => {
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

        revalidatePath("/");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: "Lỗi chuyển kho hàng loạt: " + e.message };
    }
}

export async function bulkDeleteItems(ids: string[]) {
    // --- DEMO MODE CHECK ---
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
        return { success: false, error: "Chế độ Demo: Tính năng Xóa hàng loạt bị khóa." };
    }
    // -----------------------
    try {
        await prisma.item.deleteMany({
            where: { id: { in: ids } }
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
    // Ensure default admin exists if needed
    // Ensure default admin exists ONLY if database is empty
    // Ensure default admin exists if needed
    // Ensure default admin exists ONLY if database is empty
    if (username === 'admin' && process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') {
        const userCount = await prisma.user.count();
        if (userCount === 0) {
            await prisma.user.create({
                data: {
                    username: 'admin',
                    password: 'admin',
                    fullName: 'Administrator',
                    theme: 'default',
                    colors: null
                }
            });
        }
    }

    // Security Check: If logging in as 'admin' with default password, BLOCK it if other users exist
    if (username === 'admin' && pass === 'admin') {
        const otherUsersCount = await prisma.user.count({
            where: { username: { not: 'admin' } }
        });
        if (otherUsersCount > 0) {
            return { success: false, error: "Tài khoản admin mặc định đã bị vô hiệu hóa vì hệ thống đã có người dùng mới." };
        }
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return { success: false, error: "Người dùng không tồn tại" };

    if (user.password !== pass) {
        return { success: false, error: "Sai mật khẩu" };
    }

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

export async function updateUserProfile(id: string, newUsername: string, newPass: string, newFullName?: string, newAvatar?: string) {
    // --- DEMO MODE CHECK ---
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
        return { success: false, error: "Chế độ Demo: Tính năng Cập nhật hồ sơ bị khóa." };
    }
    // -----------------------
    try {
        const data: any = { username: newUsername };
        if (newPass && newPass.trim() !== '') data.password = newPass;
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
    try {
        const data = {
            items: await prisma.item.findMany(),
            itemHistory: await prisma.itemHistory.findMany(),
            locations: await prisma.location.findMany(),
            lendingRecords: await prisma.lendingRecord.findMany(),
            templates: await prisma.template.findMany(),
            contacts: await prisma.contact.findMany(),
            brands: await prisma.brand.findMany(),
            users: await prisma.user.findMany(),
            version: "1.0",
            exportedAt: new Date().toISOString()
        };
        return { success: true, data: JSON.stringify(data, null, 2) };
    } catch (e: any) {
        return { success: false, error: "Lỗi xuất dữ liệu: " + e.message };
    }
}

export async function importDatabase(jsonString: string, clearExisting = false) {
    // --- DEMO MODE CHECK ---
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
        return { success: false, error: "Chế độ Demo: Tính năng Nhập dữ liệu bị khóa." };
    }
    // -----------------------
    try {
        const data = JSON.parse(jsonString);
        if (!data.version) throw new Error("File không hợp lệ");

        await prisma.$transaction(async (tx: any) => {
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
