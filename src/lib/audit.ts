"use server";

import { prisma } from "@/lib/db";

export type AuditAction =
    | 'CREATE'
    | 'UPDATE'
    | 'DELETE'
    | 'LEND'
    | 'RETURN'
    | 'LOGIN'
    | 'LOGOUT'
    | 'EXPORT'
    | 'IMPORT'
    | 'MOVE';

export type AuditEntityType =
    | 'ITEM'
    | 'LOCATION'
    | 'USER'
    | 'TEMPLATE'
    | 'CONTACT'
    | 'SYSTEM';

export interface AuditLogEntry {
    action: AuditAction;
    entityType: AuditEntityType;
    entityId?: string | null;
    entityName?: string | null;
    details?: string | null;
    userId?: string | null;
    userName?: string | null;
}

/**
 * Log an activity to the audit log
 */
export async function logActivity(entry: AuditLogEntry): Promise<void> {
    try {
        await prisma.auditLog.create({
            data: {
                action: entry.action,
                entityType: entry.entityType,
                entityId: entry.entityId || null,
                entityName: entry.entityName || null,
                details: entry.details || null,
                userId: entry.userId || null,
                userName: entry.userName || null,
                ipAddress: null, // Would need request context for this
            }
        });
    } catch (error) {
        console.error("Failed to log activity:", error);
        // Don't throw - audit logging should not break main functionality
    }
}

/**
 * Get audit logs with pagination
 */
export async function getAuditLogs(options?: {
    limit?: number;
    offset?: number;
    entityType?: AuditEntityType;
    action?: AuditAction;
}) {
    const { limit = 50, offset = 0, entityType, action } = options || {};

    try {
        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where: {
                    ...(entityType && { entityType }),
                    ...(action && { action }),
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            prisma.auditLog.count({
                where: {
                    ...(entityType && { entityType }),
                    ...(action && { action }),
                },
            }),
        ]);

        return { logs, total };
    } catch (error) {
        console.error("Failed to get audit logs:", error);
        return { logs: [], total: 0 };
    }
}

/**
 * Clear old audit logs (keep last N days)
 */
export async function clearOldAuditLogs(keepDays: number = 90): Promise<number> {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - keepDays);

        const result = await prisma.auditLog.deleteMany({
            where: {
                createdAt: { lt: cutoffDate }
            }
        });

        return result.count;
    } catch (error) {
        console.error("Failed to clear old audit logs:", error);
        return 0;
    }
}
