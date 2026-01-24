/**
 * Utility functions for checking warranty expiry
 */

export interface WarrantyInfo {
    hasWarranty: boolean;
    isExpired: boolean;
    isExpiringSoon: boolean;
    daysRemaining: number | null;
    expiryDate: Date | null;
}

/**
 * Check warranty status
 */
export function checkWarranty(warrantyEnd: Date | string | null): WarrantyInfo {
    if (!warrantyEnd) {
        return {
            hasWarranty: false,
            isExpired: false,
            isExpiringSoon: false,
            daysRemaining: null,
            expiryDate: null
        };
    }

    const expiry = new Date(warrantyEnd);
    const now = new Date();

    // Reset time to compare dates only
    expiry.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
        hasWarranty: true,
        isExpired: diffDays < 0,
        isExpiringSoon: diffDays >= 0 && diffDays <= 30, // Within 30 days
        daysRemaining: diffDays,
        expiryDate: expiry
    };
}

/**
 * Format warranty status for display
 */
export function formatWarrantyStatus(warrantyEnd: Date | string | null): string {
    const info = checkWarranty(warrantyEnd);

    if (!info.hasWarranty) return 'Không có';

    if (info.isExpired) {
        const daysAgo = Math.abs(info.daysRemaining || 0);
        if (daysAgo === 0) return 'Hết hạn hôm nay';
        if (daysAgo === 1) return 'Đã hết hạn 1 ngày';
        return `Đã hết hạn ${daysAgo} ngày`;
    }

    if (info.daysRemaining === 0) return 'Hết hạn hôm nay';
    if (info.daysRemaining === 1) return 'Còn 1 ngày';
    if (info.daysRemaining && info.daysRemaining <= 30) return `Còn ${info.daysRemaining} ngày`;

    // Format as date for longer warranties
    if (info.expiryDate) {
        return info.expiryDate.toLocaleDateString('vi-VN');
    }

    return '';
}

/**
 * Get warranty urgency level for styling
 * Returns: 'expired' | 'critical' | 'warning' | 'normal' | 'none'
 */
export function getWarrantyUrgency(warrantyEnd: Date | string | null): 'expired' | 'critical' | 'warning' | 'normal' | 'none' {
    const info = checkWarranty(warrantyEnd);

    if (!info.hasWarranty) return 'none';
    if (info.isExpired) return 'expired';
    if (info.daysRemaining !== null && info.daysRemaining <= 7) return 'critical';  // Within 7 days
    if (info.daysRemaining !== null && info.daysRemaining <= 30) return 'warning';  // Within 30 days
    return 'normal';
}

/**
 * Get items expiring within N days
 */
export function filterExpiringItems<T extends { warrantyEnd?: Date | string | null }>(
    items: T[],
    withinDays: number = 30
): T[] {
    return items.filter(item => {
        if (!item.warrantyEnd) return false;
        const info = checkWarranty(item.warrantyEnd);
        return info.daysRemaining !== null && info.daysRemaining >= 0 && info.daysRemaining <= withinDays;
    });
}

/**
 * Get items with expired warranty
 */
export function filterExpiredWarrantyItems<T extends { warrantyEnd?: Date | string | null }>(
    items: T[]
): T[] {
    return items.filter(item => {
        if (!item.warrantyEnd) return false;
        return checkWarranty(item.warrantyEnd).isExpired;
    });
}
