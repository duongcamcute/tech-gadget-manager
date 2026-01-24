"use client";

import { useState, useRef } from "react";
import { getAttachments, uploadAttachment, deleteAttachment } from "./actions";
import { Paperclip, Upload, Trash2, FileText, Image, File, Video, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";

interface Attachment {
    id: string;
    name: string;
    type: string;
    url: string;
    size: number | null;
    createdAt: Date;
}

interface AttachmentManagerProps {
    itemId: string;
    initialAttachments?: Attachment[];
}

const TYPE_ICONS: Record<string, any> = {
    image: Image,
    document: FileText,
    video: Video,
    spreadsheet: FileText,
    other: File,
};

export function AttachmentManager({ itemId, initialAttachments = [] }: AttachmentManagerProps) {
    const [attachments, setAttachments] = useState<Attachment[]>(initialAttachments);
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const loadAttachments = async () => {
        const data = await getAttachments(itemId);
        setAttachments(data as Attachment[]);
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);

        for (const file of Array.from(files)) {
            // Check file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                toast(`File "${file.name}" quá lớn (max 10MB)`, "error");
                continue;
            }

            try {
                // Convert to base64
                const base64 = await fileToBase64(file);

                const result = await uploadAttachment({
                    itemId,
                    name: file.name,
                    type: file.type,
                    data: base64,
                });

                if (result.success) {
                    toast(`Đã tải lên "${file.name}"`, "success");
                    await loadAttachments();
                } else {
                    toast(result.error || "Lỗi upload", "error");
                }
            } catch (error) {
                toast(`Lỗi xử lý file "${file.name}"`, "error");
            }
        }

        setUploading(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Xóa tệp "${name}"?`)) return;

        setDeleting(id);
        const result = await deleteAttachment(id);

        if (result.success) {
            toast("Đã xóa tệp", "success");
            setAttachments(prev => prev.filter(a => a.id !== id));
        } else {
            toast(result.error || "Lỗi xóa", "error");
        }

        setDeleting(null);
    };

    const formatSize = (bytes: number | null): string => {
        if (!bytes) return "";
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getIcon = (type: string) => {
        const Icon = TYPE_ICONS[type] || File;
        return Icon;
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    Tệp đính kèm ({attachments.length})
                </h4>
                <div className="relative">
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                        disabled={uploading}
                    />
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={uploading}
                        className="pointer-events-none"
                    >
                        {uploading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                            <Upload className="h-4 w-4 mr-1" />
                        )}
                        Tải lên
                    </Button>
                </div>
            </div>

            {attachments.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                    <Paperclip className="h-8 w-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                    <p className="text-sm text-gray-400 dark:text-gray-500">Chưa có tệp đính kèm</p>
                    <p className="text-xs text-gray-300 dark:text-gray-600">Hóa đơn, ảnh sản phẩm, phiếu bảo hành...</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {attachments.map((attachment) => {
                        const Icon = getIcon(attachment.type);
                        return (
                            <div
                                key={attachment.id}
                                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 group hover:border-primary-200 dark:hover:border-primary-800 transition-colors"
                            >
                                {attachment.type === "image" ? (
                                    <div className="h-10 w-10 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                                        <img
                                            src={attachment.url}
                                            alt={attachment.name}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="h-10 w-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                                        <Icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <a
                                        href={attachment.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 truncate block"
                                    >
                                        {attachment.name}
                                    </a>
                                    <p className="text-xs text-gray-400 dark:text-gray-500">
                                        {formatSize(attachment.size)}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(attachment.id, attachment.name)}
                                    disabled={deleting === attachment.id}
                                    className="h-8 w-8 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all"
                                >
                                    {deleting === attachment.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });
}
