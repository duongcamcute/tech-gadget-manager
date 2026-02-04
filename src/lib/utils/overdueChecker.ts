/**
 * Utility functions for checking overdue lending items
 */

export interface OverdueInfo {
    isOverdue: boolean;
    daysOverdue: number;
    dueDate: Date | null;
}

/**
 * Check if a lending record is overdue
 */
export function checkOverdue(dueDate: Date | string | null): OverdueInfo {
    if (!dueDate) {
        return { isOverdue: false, daysOverdue: 0, dueDate: null };
    }

    const due = new Date(dueDate);
    const now = new Date();

    // Reset time to compare dates only
    due.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    const diffTime = now.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
        isOverdue: diffDays > 0,
        daysOverdue: Math.max(0, diffDays),
        dueDate: due
    };
}

/**
 * Get days until due (negative if overdue)
 */
export function getDaysUntilDue(dueDate: Date | string | null): number {
    if (!dueDate) return Infinity;

    const due = new Date(dueDate);
    const now = new Date();

    due.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Format overdue status for display
 */
export function formatOverdueStatus(dueDate: Date | string | null): string {
    const info = checkOverdue(dueDate);

    if (!dueDate) return '';

    if (info.isOverdue) {
        if (info.daysOverdue === 1) return 'Quá hạn 1 ngày';
        return `Quá hạn ${info.daysOverdue} ngày`;
    }

    const daysLeft = getDaysUntilDue(dueDate);
    if (daysLeft === 0) return 'Đến hạn hôm nay';
    if (daysLeft === 1) return 'Còn 1 ngày';
    return `Còn ${daysLeft} ngày`;
}

/**
 * Get urgency level for styling
 * Returns: 'overdue' | 'urgent' | 'warning' | 'normal' | 'none'
 */
export function getUrgencyLevel(dueDate: Date | string | null): 'overdue' | 'urgent' | 'warning' | 'normal' | 'none' {
    if (!dueDate) return 'none';

    const daysLeft = getDaysUntilDue(dueDate);

    if (daysLeft < 0) return 'overdue';  // Already past due
    if (daysLeft <= 1) return 'urgent';   // Today or tomorrow
    if (daysLeft <= 3) return 'warning';  // Within 3 days
    return 'normal';
}
