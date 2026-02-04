"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

export type WebhookEvent =
    | "item.created"
    | "item.updated"
    | "item.deleted"
    | "item.lent"
    | "item.returned"
    | "item.moved";

export interface WebhookPayload {
    event: WebhookEvent;
    timestamp: string;
    data: Record<string, unknown>;
}

/**
 * Trigger webhooks for a specific event
 */
export async function triggerWebhooks(event: WebhookEvent, data: Record<string, unknown>): Promise<void> {
    try {
        const webhooks = await prisma.webhookConfig.findMany({
            where: { active: true }
        });

        const relevantWebhooks = webhooks.filter(w =>
            w.events.split(",").map(e => e.trim()).includes(event)
        );

        if (relevantWebhooks.length === 0) return;

        const payload: WebhookPayload = {
            event,
            timestamp: new Date().toISOString(),
            data,
        };

        // Fire and forget - don't block main operation
        Promise.allSettled(
            relevantWebhooks.map(webhook => sendWebhook(webhook, payload))
        );
    } catch (error) {
        console.error("Webhook trigger error:", error);
    }
}

/**
 * Send webhook to a single endpoint
 */
async function sendWebhook(
    webhook: { id: string; url: string; secret: string | null },
    payload: WebhookPayload
): Promise<void> {
    try {
        const body = JSON.stringify(payload);
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            "X-TGM-Event": payload.event,
            "X-TGM-Timestamp": payload.timestamp,
        };

        // Add signature if secret is configured
        if (webhook.secret) {
            const signature = crypto
                .createHmac("sha256", webhook.secret)
                .update(body)
                .digest("hex");
            headers["X-TGM-Signature"] = `sha256=${signature}`;
        }

        const response = await fetch(webhook.url, {
            method: "POST",
            headers,
            body,
            signal: AbortSignal.timeout(10000), // 10s timeout
        });

        // Update last run
        await prisma.webhookConfig.update({
            where: { id: webhook.id },
            data: {
                lastRun: new Date(),
                lastError: response.ok ? null : `HTTP ${response.status}`,
            }
        });
    } catch (error: unknown) {
        console.error(`Webhook ${webhook.id} error:`, error);
        await prisma.webhookConfig.update({
            where: { id: webhook.id },
            data: {
                lastRun: new Date(),
                lastError: error instanceof Error ? error.message : "Unknown error",
            }
        });
    }
}

/**
 * CRUD operations for webhook configs
 */
export async function getWebhooks() {
    try {
        return await prisma.webhookConfig.findMany({
            orderBy: { createdAt: "desc" }
        });
    } catch {
        return [];
    }
}

export async function createWebhook(data: {
    name: string;
    url: string;
    events: string[];
    secret?: string;
}) {
    try {
        const webhook = await prisma.webhookConfig.create({
            data: {
                name: data.name,
                url: data.url,
                events: data.events.join(","),
                secret: data.secret || null,
                active: true,
            }
        });
        revalidatePath("/settings");
        return { success: true, webhook };
    } catch (error) {
        console.error("Create webhook error:", error);
        return { success: false, error: "Lỗi tạo webhook" };
    }
}

export async function updateWebhook(id: string, data: {
    name?: string;
    url?: string;
    events?: string[];
    secret?: string;
    active?: boolean;
}) {
    try {
        const webhook = await prisma.webhookConfig.update({
            where: { id },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.url && { url: data.url }),
                ...(data.events && { events: data.events.join(",") }),
                ...(data.secret !== undefined && { secret: data.secret }),
                ...(data.active !== undefined && { active: data.active }),
            }
        });
        revalidatePath("/settings");
        return { success: true, webhook };
    } catch (error) {
        console.error("Update webhook error:", error);
        return { success: false, error: "Lỗi cập nhật webhook" };
    }
}

export async function deleteWebhook(id: string) {
    try {
        await prisma.webhookConfig.delete({ where: { id } });
        revalidatePath("/settings");
        return { success: true };
    } catch (error) {
        console.error("Delete webhook error:", error);
        return { success: false, error: "Lỗi xóa webhook" };
    }
}

export async function testWebhook(id: string) {
    try {
        const webhook = await prisma.webhookConfig.findUnique({ where: { id } });
        if (!webhook) {
            return { success: false, error: "Không tìm thấy webhook" };
        }

        const testPayload: WebhookPayload = {
            event: "item.created",
            timestamp: new Date().toISOString(),
            data: { test: true, message: "This is a test webhook from TechGadget Manager" }
        };

        await sendWebhook(webhook, testPayload);

        // Refresh to get updated lastRun/lastError
        const updated = await prisma.webhookConfig.findUnique({ where: { id } });

        return {
            success: !updated?.lastError,
            error: updated?.lastError || undefined
        };
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}
