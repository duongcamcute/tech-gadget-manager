"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";

const UPLOAD_DIR = "public/uploads/attachments";

export interface AttachmentData {
    itemId: string;
    name: string;
    type: string;
    data: string; // Base64 encoded file data
}

/**
 * Upload an attachment for an item
 */
export async function uploadAttachment(data: AttachmentData) {
    try {
        // Ensure upload directory exists
        const uploadPath = path.join(process.cwd(), UPLOAD_DIR);
        await fs.mkdir(uploadPath, { recursive: true });

        // Decode base64 data
        const buffer = Buffer.from(data.data.split(",")[1] || data.data, "base64");
        const size = buffer.length;

        // Generate unique filename
        const ext = data.name.split(".").pop() || "bin";
        const filename = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
        const filePath = path.join(uploadPath, filename);

        // Write file
        await fs.writeFile(filePath, buffer);

        // Store in database
        const url = `/uploads/attachments/${filename}`;
        const attachment = await prisma.attachment.create({
            data: {
                itemId: data.itemId,
                name: data.name,
                type: getFileType(data.name),
                url,
                size,
            },
        });

        revalidatePath("/");
        return { success: true, attachment };
    } catch (error) {
        console.error("Upload attachment error:", error);
        return { success: false, error: "Lỗi upload file" };
    }
}

/**
 * Get attachments for an item
 */
export async function getAttachments(itemId: string) {
    try {
        const attachments = await prisma.attachment.findMany({
            where: { itemId },
            orderBy: { createdAt: "desc" },
        });
        return attachments;
    } catch (error) {
        console.error("Get attachments error:", error);
        return [];
    }
}

/**
 * Delete an attachment
 */
export async function deleteAttachment(id: string) {
    try {
        const attachment = await prisma.attachment.findUnique({ where: { id } });
        if (!attachment) {
            return { success: false, error: "Không tìm thấy tệp" };
        }

        // Delete file from disk
        try {
            const filePath = path.join(process.cwd(), "public", attachment.url);
            await fs.unlink(filePath);
        } catch {
            // Ignore file deletion errors
        }

        // Delete from database
        await prisma.attachment.delete({ where: { id } });

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Delete attachment error:", error);
        return { success: false, error: "Lỗi xóa file" };
    }
}

/**
 * Get file type category
 */
function getFileType(filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase() || "";

    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "image";
    if (["pdf"].includes(ext)) return "document";
    if (["doc", "docx"].includes(ext)) return "document";
    if (["xls", "xlsx"].includes(ext)) return "spreadsheet";
    if (["mp4", "mov", "avi", "webm"].includes(ext)) return "video";

    return "other";
}
