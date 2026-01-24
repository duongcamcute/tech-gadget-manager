"use client";

import { useEffect, useState } from "react";
import { getAuditLogs } from "@/lib/audit";
import { Clock, User, Package, MapPin, FileText, RefreshCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/primitives";

interface AuditLog {
    id: string;
    action: string;
    entityType: string;
    entityId: string | null;
    entityName: string | null;
    details: string | null;
    userId: string | null;
    userName: string | null;
    createdAt: Date;
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
    'CREATE': { label: 'Tạo mới', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    'UPDATE': { label: 'Cập nhật', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    'DELETE': { label: 'Xóa', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    'LEND': { label: 'Cho mượn', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
    'RETURN': { label: 'Trả lại', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    'MOVE': { label: 'Di chuyển', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    'LOGIN': { label: 'Đăng nhập', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' },
    'LOGOUT': { label: 'Đăng xuất', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
    'EXPORT': { label: 'Xuất dữ liệu', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    'IMPORT': { label: 'Nhập dữ liệu', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
};

const ENTITY_ICONS: Record<string, any> = {
    'ITEM': Package,
    'LOCATION': MapPin,
    'USER': User,
    'TEMPLATE': FileText,
    'SYSTEM': Clock,
};

export function AuditLogViewer() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const limit = 20;

    useEffect(() => {
        loadLogs();
    }, [page]);

    const loadLogs = async () => {
        setLoading(true);
        const result = await getAuditLogs({ limit, offset: page * limit });
        setLogs(result.logs as AuditLog[]);
        setTotal(result.total);
        setLoading(false);
    };

    const totalPages = Math.ceil(total / limit);

    const formatDate = (date: Date) => {
        const d = new Date(date);
        return d.toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100">Nhật ký hoạt động</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Theo dõi các thay đổi trong hệ thống</p>
                </div>
                <Button variant="ghost" size="icon" onClick={loadLogs} disabled={loading}>
                    <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            {loading ? (
                <div className="p-8 flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
                </div>
            ) : logs.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    <Clock className="h-12 w-12 mx-auto mb-2 opacity-30" />
                    <p>Chưa có hoạt động nào được ghi nhận</p>
                </div>
            ) : (
                <>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {logs.map((log) => {
                            const actionConfig = ACTION_LABELS[log.action] || { label: log.action, color: 'bg-gray-100 text-gray-700' };
                            const EntityIcon = ENTITY_ICONS[log.entityType] || Clock;

                            return (
                                <div key={log.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                            <EntityIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${actionConfig.color}`}>
                                                    {actionConfig.label}
                                                </span>
                                                {log.entityName && (
                                                    <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                                        {log.entityName}
                                                    </span>
                                                )}
                                            </div>
                                            {log.details && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                                    {log.details}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {formatDate(log.createdAt)}
                                                </span>
                                                {log.userName && (
                                                    <span className="flex items-center gap-1">
                                                        <User className="h-3 w-3" />
                                                        {log.userName}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {totalPages > 1 && (
                        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                Trang {page + 1} / {totalPages} ({total} mục)
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.max(0, p - 1))}
                                    disabled={page === 0}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                    disabled={page >= totalPages - 1}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
