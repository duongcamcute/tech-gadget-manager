"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Calendar, MapPin, History, Edit3, Trash2, Save, User, Clock, Package, ArrowRight, ArrowLeft, Copy, Plus, ChevronsUpDown, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn, buildLocationTree } from "@/lib/utils";
import { Button, Input, Select, Label } from "@/components/ui/primitives";
import { updateItem, deleteItem } from "@/app/actions";
import { useRouter } from "next/navigation";
import { SpecInput } from "./SpecInput";
import { useToast } from "@/components/ui/toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ItemSchema, ItemFormData } from "@/types/schema";
import { LendingFields } from "./LendingFields";
import { formatDateVN, formatDateTimeVN } from "@/lib/utils/date";
import { AutoCompleteInput } from "@/components/ui/AutoCompleteInput";
import { ColorPicker } from "@/components/ui/ColorPicker";
import { IconSelect } from "@/components/ui/IconSelect";
import { getColorHex } from "@/lib/utils/colors";
import { ITEM_TYPES, LOCATION_ICONS, ITEM_ICONS, BADGE_ICONS_MAP, BADGE_COLORS_MAP } from "@/lib/constants/options";
import { TECH_SUGGESTIONS } from "@/lib/constants";
import { optimizeImage, formatBytes, getBase64Size } from "@/lib/imageUtils";

const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return "---";
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const calculateUsageDuration = (startDate: string | Date | null | undefined) => {
    if (!startDate) return null;
    const start = new Date(startDate);
    const now = new Date();

    // Nếu ngày mua > hiện tại (vô lý)
    if (start > now) return "Chưa sử dụng";

    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();
    let days = now.getDate() - start.getDate();

    if (days < 0) {
        months--;
        // Lấy số ngày của tháng trước đó
        const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        days += prevMonth.getDate();
    }
    if (months < 0) {
        years--;
        months += 12;
    }

    const parts = [];
    if (years > 0) parts.push(`${years} năm`);
    if (months > 0) parts.push(`${months} tháng`);

    // Nếu chưa đầy 1 tháng, hiển thị số ngày
    if (years === 0 && months === 0) {
        if (days === 0) return "Vừa mới mua";
        return `${days} ngày`;
    }

    return parts.join(" ");
};

// --- Local UI Components for speed ---
const Badge = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${className}`}>{children}</span>
);

const Tabs = ({ children, value, onValueChange }: any) => {
    return <div className="w-full">{children}</div>
}
const TabsList = ({ children }: any) => <div className="flex border-b border-gray-200 mb-4">{children}</div>
const TabsTrigger = ({ children, value, activeValue, onClick }: any) => (
    <button
        onClick={() => onClick(value)}
        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeValue === value ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
    >
        {children}
    </button>
)
const TabsContent = ({ children, value, activeValue }: any) => {
    if (value !== activeValue) return null;
    return <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">{children}</div>
}



export function ItemDetailDialog({ item, isOpen, onClose, locations }: { item: any, isOpen: boolean, onClose: () => void, locations: any[] }) {
    const [mode, setMode] = useState<"VIEW" | "EDIT">("VIEW");

    // Reset when opening different item
    useEffect(() => { setMode("VIEW") }, [item?.id]);

    if (!isOpen || !item) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="relative w-full max-w-3xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-600 flex items-center justify-center bg-white dark:bg-gray-700">
                            <div className="w-8 h-8 rounded-full shadow-inner border border-gray-100" style={{ backgroundColor: getColorHex(item.color) }} title={item.color || "No color"} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 break-words leading-tight">{mode === 'EDIT' ? 'Chỉnh sửa thông tin' : item.name}</h2>
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1.5 rounded text-xs">#{item.id.slice(0, 6)}</span>
                                <span>•</span>
                                <span className="font-medium text-primary-600 dark:text-primary-400">{item.brand || "Chưa rõ hãng"}</span>
                            </div>
                        </div>
                    </div>
                    <Button variant="ghost" onClick={onClose} className="rounded-full h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"><X className="h-5 w-5 text-gray-500 dark:text-gray-400" /></Button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto">
                    {mode === "VIEW" ? (
                        <ViewMode item={item} setMode={setMode} onDelete={() => {
                            if (confirm("Xác nhận xóa thiết bị này?")) deleteItem(item.id).then(() => { onClose(); });
                        }} />
                    ) : (
                        <EditMode item={item} locations={locations} onCancel={() => setMode("VIEW")} onClose={onClose} />
                    )}
                </div>
            </div>
        </div>
    );
}

// Helper to safely parse specs
const safeParseSpecs = (specs: any) => {
    try {
        if (!specs) return {};
        if (typeof specs === 'object') return specs;
        return JSON.parse(specs);
    } catch { return {}; }
};

function ViewMode({ item, setMode, onDelete }: { item: any, setMode: (m: "EDIT") => void, onDelete: () => void }) {
    const { toast } = useToast();
    const router = useRouter();
    const [localHistory, setLocalHistory] = useState<any[]>(
        item.history ? [...item.history].sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) : []
    );

    const handleDeleteHistory = async (historyId: string) => {
        if (!confirm("Xác nhận xóa mục lịch sử này?")) return;
        try {
            const { deleteItemHistory } = await import("@/app/actions");
            const res = await deleteItemHistory(historyId);
            if (res.success) {
                setLocalHistory(prev => prev.filter(h => h.id !== historyId));
                toast("Đã xóa lịch sử", "success");
                router.refresh();
            } else {
                toast("Lỗi: " + res.error, "error");
            }
        } catch (e) {
            toast("Lỗi hệ thống", "error");
        }
    };

    const styles = {
        'Available': "bg-emerald-100 text-emerald-800 border-emerald-200",
        'InUse': "bg-blue-100 text-blue-800 border-blue-200",
        'Lent': "bg-primary-100 text-primary-800 border-primary-200",
        'Lost': "bg-red-100 text-red-800 border-red-200",
    } as any;

    const history = localHistory;
    const allSpecs = safeParseSpecs(item.specs);

    // List of keys we handle manually in the UI (to avoid duplication in dynamic list)
    // Actually, we will render ALL dynamic specs in the bottom grid, except maybe "other" if we want to special case it.
    // For now, let's treat standard fields (brand, model) as separate from "specs" json object.
    // But "specs" json object contains things like "power", "capacity". We should render all of them.

    return (
        <div className="flex flex-col min-h-full">
            {/* Top Section: Image & History */}
            <div className="grid md:grid-cols-12 border-b border-gray-100 dark:border-gray-700">
                {/* Image & Basic Info Column */}
                <div className="md:col-span-7 p-6 space-y-6">
                    {/* Image */}
                    {item.image ? (
                        <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                            <img src={item.image} alt={item.name} className="w-full max-h-[400px] object-contain hover:scale-105 transition-transform duration-500" />
                        </div>
                    ) : (
                        <div className="h-64 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 bg-gray-50 dark:bg-gray-800/50">
                            <div className="text-center">
                                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <span className="text-sm">Không có hình ảnh</span>
                            </div>
                        </div>
                    )}

                    {/* Basic Status Bar (Mobile Friendly) */}
                    <div className="flex flex-wrap items-center gap-3">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold border uppercase tracking-wide flex items-center gap-2 ${styles[item.status] || styles['Available']}`}>
                            <div className={`w-2 h-2 rounded-full ${item.status === 'Available' ? 'bg-emerald-500' :
                                item.status === 'InUse' ? 'bg-blue-500' :
                                    item.status === 'Lent' ? 'bg-primary-500' :
                                        item.status === 'Damaged' ? 'bg-orange-500' :
                                            'bg-red-500'
                                }`} />
                            {item.status === 'Available' && "Sẵn sàng"}
                            {item.status === 'InUse' && "Đang sử dụng"}
                            {item.status === 'Lent' && "Đang cho mượn"}
                            {item.status === 'Damaged' && "Hư hỏng"}
                            {item.status === 'Lost' && "Thất lạc"}
                        </span>
                        <div className="flex items-center text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700">
                            <MapPin className="h-3.5 w-3.5 mr-1.5 text-gray-500 dark:text-gray-400" />
                            <span className="font-medium">{item.location?.name || "Chưa có vị trí"}</span>
                        </div>
                    </div>
                </div>

                {/* History Column (Scrollable, matching height visually) */}
                <div className="md:col-span-5 bg-gray-50/50 dark:bg-gray-800/50 border-l border-gray-100 dark:border-gray-700 p-6 flex flex-col">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-4 flex items-center gap-2 shrink-0">
                        <History className="h-4 w-4" /> Lịch sử thiết bị
                    </h3>

                    {/* Scrollable Container with Max Height */}
                    <div className="overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                        <div className="relative space-y-6 pl-2 pb-2">
                            {/* Line */}
                            <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-slate-200 dark:bg-slate-700" />

                            {history.map((h: any, idx: number) => (
                                <div key={h.id || idx} className="relative pl-6 group">
                                    <div className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-gray-800 bg-primary-400 shadow-sm z-10" />
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{h.action === 'CREATED' ? 'Nhập kho' : h.action === 'MOVED' ? 'Di chuyển' : h.action === 'LENT' ? 'Cho mượn' : h.action === 'RETURNED' ? 'Đã trả lại' : 'Cập nhật'}</span>
                                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 break-words bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded p-1.5 shadow-sm inline-block">
                                                {h.details}
                                            </div>
                                            <span className="text-[10px] text-gray-400 font-mono mt-1">{formatDateTimeVN(h.timestamp)}</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteHistory(h.id)}
                                            className="h-6 w-6 p-0 text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                            title="Xóa mục lịch sử này"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}

                            {history.length === 0 && (
                                <div className="relative pl-6">
                                    <div className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full bg-slate-300 border-2 border-white" />
                                    <p className="text-sm text-gray-500 italic">Chưa có lịch sử ghi nhận.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Section: Full Width Details */}
            <div className="p-6 space-y-6 bg-white dark:bg-gray-800">

                {/* Notes (Full Width) */}
                {item.notes && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-xl border border-yellow-100 dark:border-yellow-900/20">
                        <h3 className="text-xs font-bold text-yellow-700 dark:text-yellow-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Edit3 className="h-3 w-3" /> Ghi chú
                        </h3>
                        <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">{item.notes}</p>
                    </div>
                )}

                {/* Technical Specs Grid (Full Width -> 2/3 cols) */}
                <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
                        Chi tiết kỹ thuật
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-6">

                        {/* Standard Fields */}
                        {item.brand && (
                            <div className="border-l-2 border-indigo-100 pl-3">
                                <p className="text-[10px] text-gray-500 uppercase font-semibold mb-0.5">Hãng sản xuất</p>
                                <p className="font-medium text-gray-900 dark:text-gray-100 break-words text-sm">{item.brand}</p>
                            </div>
                        )}
                        {item.model && (
                            <div className="border-l-2 border-indigo-100 pl-3">
                                <p className="text-[10px] text-gray-500 uppercase font-semibold mb-0.5">Model</p>
                                <p className="font-mono font-medium text-gray-900 dark:text-gray-100 break-words text-sm">{item.model}</p>
                            </div>
                        )}
                        {item.color && (
                            <div className="border-l-2 border-indigo-100 pl-3">
                                <p className="text-[10px] text-gray-500 uppercase font-semibold mb-0.5">Màu sắc</p>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full border border-gray-300" style={{ backgroundColor: getColorHex(item.color) }}></div>
                                    <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{item.color}</p>
                                </div>
                            </div>
                        )}
                        {item.serialNumber && (
                            <div className="border-l-2 border-indigo-100 pl-3">
                                <p className="text-[10px] text-gray-500 uppercase font-semibold mb-0.5">Serial Number</p>
                                <p className="font-mono font-medium text-gray-900 dark:text-gray-100 break-words text-sm">{item.serialNumber}</p>
                            </div>
                        )}

                        {/* Financial / Dates */}
                        {item.purchaseDate && (
                            <div className="border-l-2 border-emerald-100 pl-3">
                                <p className="text-[10px] text-gray-500 uppercase font-semibold mb-0.5">Ngày mua</p>
                                <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{formatDateVN(item.purchaseDate)}</p>
                                <p className="text-[10px] text-blue-500 mt-0.5">{calculateUsageDuration(item.purchaseDate)}</p>
                            </div>
                        )}

                        {item.purchasePrice && (
                            <div className="border-l-2 border-emerald-100 pl-3">
                                <p className="text-[10px] text-gray-500 uppercase font-semibold mb-0.5">Giá mua</p>
                                <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{formatCurrency(item.purchasePrice)}</p>
                            </div>
                        )}

                        <div className="border-l-2 border-emerald-100 pl-3">
                            <p className="text-[10px] text-gray-500 uppercase font-semibold mb-0.5">Bảo hành</p>
                            {item.warrantyEnd ? (
                                <p className="font-medium text-green-700 dark:text-green-400 text-sm">{formatDateVN(item.warrantyEnd)}</p>
                            ) : (
                                <p className="font-medium text-gray-400 text-sm italic">Không bảo hành</p>
                            )}
                        </div>

                        {item.purchaseLocation && (
                            <div className="border-l-2 border-emerald-100 pl-3">
                                <p className="text-[10px] text-gray-500 uppercase font-semibold mb-0.5">Nơi mua</p>
                                <p className="font-medium text-gray-900 dark:text-gray-100 break-words text-sm">{item.purchaseLocation}</p>
                            </div>
                        )}

                        {/* Purchase URL (Always full width on mobile, span on desktop if needed) */}
                        {item.purchaseUrl && (
                            <div className="col-span-2 border-l-2 border-blue-100 pl-3">
                                <p className="text-[10px] text-gray-500 uppercase font-semibold mb-0.5">Link mua hàng</p>
                                <a href={item.purchaseUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 dark:text-blue-400 hover:underline break-all text-sm line-clamp-2 hover:line-clamp-none">{item.purchaseUrl}</a>
                            </div>
                        )}

                        {/* DYNAMIC SPECS LOOP - Render ALL of them, skip 'other' if empty */}
                        {Object.entries(allSpecs)
                            .filter(([k, v]: any) => {
                                // Ẩn field "other" nếu trống
                                if (k.toLowerCase() === 'other' && (!v || String(v).trim() === '')) {
                                    return false;
                                }
                                return true;
                            })
                            .map(([k, v]: any) => (
                                <div key={k} className={`border-l-2 border-slate-200 pl-3 ${String(v).length > 30 ? 'col-span-2' : ''}`}>
                                    <p className="text-[10px] text-gray-500 uppercase font-semibold mb-0.5">{k}</p>
                                    <p className="font-medium text-gray-900 dark:text-gray-100 break-words text-sm whitespace-pre-line" title={v}>{String(v)}</p>
                                </div>
                            ))}

                        {/* Fallback if practically empty */}
                        {(!item.brand && !item.model && Object.keys(allSpecs).length === 0) && (
                            <div className="col-span-full py-4 text-center text-gray-400 text-sm italic">
                                Chưa có thông tin kỹ thuật chi tiết.
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-6 flex gap-3 border-t border-gray-100 dark:border-gray-700 mt-6">
                    <Button onClick={() => setMode("EDIT")} className="flex-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700">
                        <Edit3 className="h-4 w-4 mr-2" /> Chỉnh sửa
                    </Button>
                    <Button
                        onClick={() => window.location.href = `/?clone=${item.id}`}
                        variant="ghost"
                        className="text-gray-500 hover:bg-gray-100 hover:text-primary-600"
                        title="Sao chép / Tạo bản sao"
                    >
                        <Copy className="h-4 w-4" />
                    </Button>
                    <Button onClick={onDelete} variant="ghost" className="text-red-500 hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

function EditMode({ item, locations, onCancel, onClose }: { item: any, locations: any[], onCancel: () => void, onClose: () => void }) {
    const { toast } = useToast();
    const router = useRouter();
    const [serverBrands, setServerBrands] = useState<any[]>([]);
    const [serverContacts, setServerContacts] = useState<any[]>([]);
    const [availableItemTypes, setAvailableItemTypes] = useState<any[]>([...ITEM_TYPES]);
    const [openType, setOpenType] = useState(false);
    const [openLocation, setOpenLocation] = useState(false);
    const flatLocations = useMemo(() => buildLocationTree(locations || []), [locations]);


    useEffect(() => {
        const loadTypes = async () => {
            try {
                const { getItemTypes } = await import("@/app/actions");
                const dynamicTypes = await getItemTypes();
                if (dynamicTypes && dynamicTypes.length > 0) {
                    setAvailableItemTypes(prev => {
                        const combined = [...ITEM_TYPES, ...dynamicTypes];
                        return Array.from(new Map(combined.map(item => [item.value, item])).values());
                    });
                }
            } catch (e) {
                console.error("Failed to load dynamic types", e);
            }
        };
        loadTypes();
    }, []);

    const [imgPreview, setImgPreview] = useState<string | null>(item.image || null);
    const [warrantyMonths, setWarrantyMonths] = useState<string>("");

    useEffect(() => {
        import("@/app/actions").then(mod => {
            mod.getBrands().then(setServerBrands);
            mod.getContacts().then(setServerContacts);
        });
    }, []);

    // Use type inference only to avoid mismatches
    const form = useForm({
        resolver: zodResolver(ItemSchema),
        defaultValues: {
            ...item,
            specs: typeof item.specs === 'string' ? JSON.parse(item.specs) : item.specs,
            purchaseDate: item.purchaseDate ? new Date(item.purchaseDate).toISOString().split('T')[0] : null,
            status: item.status,
            dueDate: item.lendingRecords?.[0]?.dueDate ? new Date(item.lendingRecords[0].dueDate).toISOString().split('T')[0] : null,
            borrowDate: item.lendingRecords?.[0]?.borrowDate ? new Date(item.lendingRecords[0].borrowDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            borrowerName: item.lendingRecords?.[0]?.borrowerName || "",
            warrantyEnd: item.warrantyEnd ? new Date(item.warrantyEnd).toISOString().split('T')[0] : null,
            serialNumber: item.serialNumber || ""
        }
    });

    const watchedStatus = form.watch("status");
    const purchaseDate = form.watch("purchaseDate");

    useEffect(() => {
        if (purchaseDate && warrantyMonths) {
            const months = parseInt(warrantyMonths);
            if (!isNaN(months)) {
                const date = new Date(purchaseDate);
                date.setMonth(date.getMonth() + months);
                form.setValue("warrantyEnd", date.toISOString().split('T')[0]);
            }
        }
    }, [purchaseDate, warrantyMonths, form]);
    const watchedColor = form.watch("color");

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                // Optimize image: resize to 800x800 max, convert to WebP
                const optimized = await optimizeImage(file);
                setImgPreview(optimized);
                form.setValue("image", optimized);

                // Log size reduction
                const originalSize = file.size;
                const newSize = getBase64Size(optimized);
                console.log(`Image optimized: ${formatBytes(originalSize)} → ${formatBytes(newSize)} (${Math.round((1 - newSize / originalSize) * 100)}% smaller)`);
            } catch (err) {
                console.error("Image optimization failed:", err);
                toast("Lỗi xử lý ảnh", "error");
            }
        }
    };

    const onSubmit = async (data: any) => {
        // Explicitly cast or valid inside action
        const res = await updateItem(item.id, data as ItemFormData);
        if (res.success) {
            toast("Đã cập nhật!", "success");
            onClose();
            router.refresh();
        } else {
            toast("Lỗi: " + res.error, "error");
        }
    };

    const onError = (errors: any) => {
        console.error("Form Errors Full:", JSON.stringify(errors, null, 2));
        alert("Lỗi nhập liệu: " + Object.keys(errors).join(", "));
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit, onError)} className="p-6 grid grid-cols-1 gap-6">
            <datalist id="edit-list-contacts">{serverContacts.map(c => <option key={c.id} value={c.name} />)}</datalist>

            <div className="space-y-4">
                {/* Image Edit */}
                <div className="flex items-center gap-4 border-b border-gray-100 dark:border-gray-700 pb-4">
                    <div className={`h-16 w-16 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-900 ${imgPreview ? 'border-primary-500' : 'border-gray-200 dark:border-gray-700'}`}>
                        {imgPreview ? <img src={imgPreview} alt="Preview" className="h-full w-full object-cover" /> : <Package className="h-6 w-6 text-gray-300 dark:text-gray-600" />}
                    </div>
                    <div className="flex-1">
                        <Label>Ảnh thiết bị</Label>
                        <div className="flex gap-2">
                            <Input type="file" accept="image/*" onChange={handleImageChange} className="mt-1 h-9 text-xs file:hidden" />
                            {imgPreview && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setImgPreview(null);
                                        form.setValue("image", "", { shouldDirty: true });
                                    }}
                                    className="mt-1 h-9 text-red-500 hover:bg-red-50 hover:text-red-600"
                                >
                                    <Trash2 className="h-4 w-4 mr-1" /> Xóa ảnh
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <Label>Tên thiết bị</Label>
                        <Input {...form.register("name")} className="font-bold" />
                    </div>
                    <div className="col-span-1">
                        <Label>Loại thiết bị</Label>
                        <Popover open={openType} onOpenChange={setOpenType} modal={true}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openType}
                                    className="w-full justify-between bg-white h-10 font-normal px-3 border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                                >
                                    <span className="truncate">
                                        {form.watch("type")
                                            ? availableItemTypes.find((type) => type.value === form.watch("type"))?.label
                                            : "Chọn loại..."}
                                    </span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[280px] p-0 z-[9999]" align="start">
                                <Command>
                                    <CommandInput placeholder="Tìm loại thiết bị..." />
                                    <CommandList>
                                        <CommandEmpty>Không tìm thấy loại này.</CommandEmpty>
                                        <CommandGroup className="max-h-[300px] overflow-y-auto">
                                            {availableItemTypes.map((type) => (
                                                <CommandItem
                                                    key={type.value}
                                                    value={type.label}
                                                    onSelect={() => {
                                                        form.setValue("type", type.value, { shouldDirty: true, shouldTouch: true });
                                                        setOpenType(false);
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            form.watch("type") === type.value ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {type.label}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="col-span-1">
                        <Label>Icon</Label>
                        <IconSelect
                            value={form.watch("category") || ""}
                            onValueChange={(val) => form.setValue("category", val, { shouldDirty: true, shouldTouch: true })}
                        />
                    </div>
                    <div>
                        <Label>Hãng</Label>
                        <AutoCompleteInput
                            suggestions={Array.from(new Set([...serverBrands.map(b => b.name), ...TECH_SUGGESTIONS.brands]))}
                            value={form.watch("brand") || ""}
                            onValueChange={(v) => form.setValue("brand", v)}
                            className="bg-white dark:bg-gray-800 dark:text-gray-100"
                        />
                    </div>
                    <div>
                        <Label>Màu sắc</Label>
                        <ColorPicker
                            value={watchedColor || ""}
                            onChange={(v) => form.setValue("color", v, { shouldDirty: true, shouldTouch: true })}
                            className="w-full bg-white dark:bg-gray-800"
                        />
                    </div>
                </div>

                {/* ADDITIONAL INFO SECTION */}
                <div className="space-y-4 pt-2 border-t border-gray-100">
                    <Label className="text-xs font-bold text-gray-500 uppercase">Thông tin chi tiết</Label>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Model</Label>
                            <Input {...form.register("model")} placeholder="VD: A2345" />
                        </div>
                        <div>
                            <Label>Serial Number</Label>
                            <Input {...form.register("serialNumber")} placeholder="S/N..." />
                        </div>
                        <div>
                            <Label>Giá mua (VNĐ)</Label>
                            <Input
                                defaultValue={form.getValues("purchasePrice") ? new Intl.NumberFormat('vi-VN').format(form.getValues("purchasePrice")) : ""}
                                onChange={(e) => {
                                    // Visual format
                                    const raw = e.target.value.replace(/\D/g, '');
                                    const formatted = raw.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                                    e.target.value = formatted;
                                }}
                                onBlur={(e) => {
                                    // Save actual number to form
                                    const raw = e.target.value.replace(/\./g, '');
                                    if (raw) {
                                        form.setValue("purchasePrice", parseInt(raw), { shouldValidate: true, shouldDirty: true });
                                    } else {
                                        form.setValue("purchasePrice", undefined); // or null
                                    }
                                }}
                                placeholder="VNĐ..."
                            />
                        </div>
                        <div>
                            <Label>Ngày mua</Label>
                            <Input type="date" {...form.register("purchaseDate")} />
                        </div>
                        <div>
                            <Label>Nơi mua</Label>
                            <Input {...form.register("purchaseLocation")} placeholder="Cửa hàng, Shopee..." />
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-center mb-2">
                                <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Hạn bảo hành</Label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="edit-no-warranty"
                                        checked={!form.watch("warrantyEnd") && warrantyMonths === ""}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                // Disable Warranty
                                                setWarrantyMonths("");
                                                form.setValue("warrantyEnd", null, { shouldDirty: true });
                                            } else {
                                                // Enable Warranty (Restore default)
                                                setWarrantyMonths("12");
                                                // Trigger update via effect or manual set if date exists
                                                const pDate = form.getValues("purchaseDate");
                                                if (pDate) {
                                                    const d = new Date(pDate);
                                                    d.setMonth(d.getMonth() + 12);
                                                    form.setValue("warrantyEnd", d.toISOString().split('T')[0], { shouldDirty: true });
                                                }
                                            }
                                        }}
                                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                                    />
                                    <label htmlFor="edit-no-warranty" className="text-xs font-medium text-gray-600 dark:text-gray-400 cursor-pointer select-none">Không bảo hành</label>
                                </div>
                            </div>
                            <div className={`flex flex-col gap-2 transition-opacity duration-200 ${(!form.watch("warrantyEnd") && warrantyMonths === "") ? 'opacity-50 pointer-events-none' : ''}`}>
                                <Input
                                    type="date"
                                    {...form.register("warrantyEnd")}
                                    className="h-9 bg-white dark:bg-gray-900"
                                    disabled={!form.watch("warrantyEnd") && warrantyMonths === ""}
                                />
                                <div className="flex gap-2 items-center">
                                    <Input
                                        type="number"
                                        placeholder="Tháng..."
                                        className="h-9 w-20 text-xs bg-white dark:bg-gray-900"
                                        value={warrantyMonths}
                                        onChange={(e) => setWarrantyMonths(e.target.value)}
                                        disabled={!form.watch("warrantyEnd") && warrantyMonths === ""}
                                    />
                                    <Select
                                        className="h-9 flex-1 bg-white dark:bg-gray-900 text-xs"
                                        onChange={(e) => {
                                            if (e.target.value) setWarrantyMonths(e.target.value);
                                        }}
                                        value={""}
                                        disabled={!form.watch("warrantyEnd") && warrantyMonths === ""}
                                    >
                                        <option value="">+ Chọn nhanh...</option>
                                        <option value="6">6 Tháng</option>
                                        <option value="12">12 Tháng</option>
                                        <option value="18">18 Tháng</option>
                                        <option value="24">24 Tháng (2 Năm)</option>
                                        <option value="36">36 Tháng (3 Năm)</option>
                                    </Select>
                                </div>
                            </div>
                        </div>
                        <div className="col-span-2">
                            <Label>Link mua hàng</Label>
                            <Input {...form.register("purchaseUrl")} placeholder="https://..." />
                        </div>
                        <div className="col-span-2">
                            <Label>Ghi chú</Label>
                            <textarea
                                {...form.register("notes")}
                                placeholder="Ghi chú thêm về tình trạng, lịch sử..."
                                className="flex min-h-[80px] w-full rounded-lg border border-input bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-gray-900 dark:text-gray-100"
                            />
                        </div>
                        <div className="col-span-2 space-y-2">
                            <Label>Thông số kỹ thuật</Label>
                            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-2">
                                {(() => {
                                    const currentSpecs = form.watch("specs") || {};
                                    // Filter out null/undefined values to avoid display issues
                                    const entries = Object.entries(currentSpecs).filter(([k, v]) => v !== null && v !== undefined && k !== 'displayBadges');

                                    const updateSpec = (key: string, val: string) => {
                                        const newSpecs = { ...currentSpecs, [key]: val };
                                        form.setValue("specs", newSpecs, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
                                    };

                                    const removeSpec = (keyToRem: string) => {
                                        const newSpecs = { ...currentSpecs };
                                        delete newSpecs[keyToRem];
                                        form.setValue("specs", newSpecs);
                                    };

                                    return (
                                        <>
                                            {entries.map(([k, v]) => (
                                                <div key={k} className="flex gap-2 items-center">
                                                    <div className="w-1/3 text-xs font-medium text-gray-500 bg-white px-2 py-1.5 rounded border border-gray-200 truncate" title={k}>
                                                        {k}
                                                    </div>
                                                    <Input
                                                        value={v as string}
                                                        onChange={(e) => updateSpec(k, e.target.value)}
                                                        className="h-8 text-xs flex-1 bg-white"
                                                        placeholder="Giá trị..."
                                                    />
                                                    <Button type="button" variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => removeSpec(k)}>
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </div>
                                            ))}

                                            <SpecInput
                                                onAdd={(key, val) => updateSpec(key, val)}
                                            />
                                        </>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* Display Badges Selection (Dynamic) */}
                        <div className="col-span-2 space-y-3 bg-gray-50/50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                            <div>
                                <Label className="flex items-center gap-2 text-base font-semibold">
                                    Badge hiển thị
                                    <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">Custom</span>
                                </Label>
                                <p className="text-xs text-gray-500 mb-3">Chọn thông tin để hiển thị nổi bật trên thẻ thiết bị.</p>
                            </div>

                            {(() => {
                                // Default or existing badges
                                const currentSpecs = form.watch("specs") || {};
                                let currentBadges: any[] = currentSpecs.displayBadges || [];

                                // Migration: If string[], convert to objects
                                if (currentBadges.length > 0 && typeof currentBadges[0] === 'string') {
                                    currentBadges = currentBadges.map((key: string) => ({ key, icon: 'tag', color: 'blue' }));
                                }

                                const updateBadges = (newBadges: any[]) => {
                                    const newSpecs = { ...currentSpecs, displayBadges: newBadges };
                                    form.setValue("specs", newSpecs, { shouldDirty: true });
                                };

                                // Get all available keys
                                const specKeys = Object.keys(currentSpecs).filter(k => k !== 'displayBadges');
                                const standardKeys = ['brand', 'type', 'purchaseLocation', 'warrantyEnd'];
                                const allKeys = Array.from(new Set([...standardKeys, ...specKeys]));

                                return (
                                    <div className="space-y-3">
                                        {/* List of active badges */}
                                        <div className="space-y-2">
                                            {currentBadges.map((badge: any, idx: number) => (
                                                <div key={idx} className="flex gap-2 items-center bg-white dark:bg-gray-900 p-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm animate-in slide-in-from-left-2 fade-in duration-200">
                                                    {/* Field Select */}
                                                    <div className="w-1/3 min-w-[120px]">
                                                        <div className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Trường thông tin</div>
                                                        <div className="font-medium text-sm truncate">{badge.key}</div>
                                                    </div>

                                                    {/* Icon Select (Dynamic) */}
                                                    <div className="flex-1">
                                                        <div className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Icon</div>
                                                        <Select
                                                            value={badge.icon || 'tag'}
                                                            onChange={(e) => {
                                                                const updated = [...currentBadges];
                                                                updated[idx] = { ...updated[idx], icon: e.target.value };
                                                                updateBadges(updated);
                                                            }}
                                                            className="h-8 text-xs w-full"
                                                        >
                                                            {Object.keys(BADGE_ICONS_MAP).map(k => (
                                                                <option key={k} value={k}>{k}</option>
                                                            ))}
                                                        </Select>
                                                    </div>

                                                    {/* Color Select (Dynamic) */}
                                                    <div className="flex-1">
                                                        <div className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Màu</div>
                                                        <Select
                                                            value={badge.color || 'blue'}
                                                            onChange={(e) => {
                                                                const updated = [...currentBadges];
                                                                updated[idx] = { ...updated[idx], color: e.target.value };
                                                                updateBadges(updated);
                                                            }}
                                                            className="h-8 text-xs w-full"
                                                        >
                                                            {Object.keys(BADGE_COLORS_MAP).map(k => (
                                                                <option key={k} value={k}>{k}</option>
                                                            ))}
                                                        </Select>
                                                    </div>

                                                    {/* Remove */}
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600 mt-4"
                                                        onClick={() => {
                                                            const updated = currentBadges.filter((_, i) => i !== idx);
                                                            updateBadges(updated);
                                                        }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Add New Badge */}
                                        <div className="flex gap-2 items-end pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
                                            <div className="flex-1">
                                                <Label className="text-xs mb-1 block">Thêm badge mới</Label>
                                                <Select
                                                    id="new-badge-select"
                                                    className="h-9 text-sm"
                                                    onChange={(e) => {
                                                        if (e.target.value) {
                                                            const newBadge = {
                                                                key: e.target.value,
                                                                icon: 'tag',
                                                                color: 'blue'
                                                            };
                                                            updateBadges([...currentBadges, newBadge]);
                                                            e.target.value = ""; // Reset select
                                                        }
                                                    }}
                                                    value=""
                                                >
                                                    <option value="">+ Chọn trường thông tin...</option>
                                                    {allKeys.filter(k => !currentBadges.some((b: any) => b.key === k)).map(k => (
                                                        <option key={k} value={k}>{k}</option>
                                                    ))}
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-primary-50 border border-primary-100 rounded-xl space-y-4">
                    <h4 className="text-xs font-bold text-primary-700 uppercase">Trạng thái & Vị trí</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Trạng thái hiện tại</Label>
                            <Select {...form.register("status")} className="bg-white dark:bg-gray-800 dark:text-gray-100">
                                <option value="Available">Sẵn sàng (Available)</option>
                                <option value="InUse">Đang dùng (In Use)</option>
                                <option value="Lent">Cho mượn (Lent)</option>
                                <option value="Damaged">Hư hỏng (Damaged)</option>
                                <option value="Lost">Thất lạc (Lost)</option>
                            </Select>
                        </div>
                        <div>
                            <Label>Vị trí</Label>
                            <Popover open={openLocation} onOpenChange={setOpenLocation} modal={true}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openLocation}
                                        className="w-full justify-between bg-white h-10 font-normal px-3 border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                                    >
                                        <span className="truncate">
                                            {form.watch("locationId")
                                                ? flatLocations.find((l: any) => l.id === form.watch("locationId"))?.name
                                                : "-- Chưa xác định --"}
                                        </span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0 z-[9999]" align="start">
                                    <Command>
                                        <CommandInput placeholder="Tìm vị trí..." />
                                        <CommandList>
                                            <CommandEmpty>Không tìm thấy vị trí.</CommandEmpty>
                                            <CommandGroup className="max-h-[300px] overflow-y-auto">
                                                {flatLocations.map((loc: any) => (
                                                    <CommandItem
                                                        key={loc.id}
                                                        value={loc.name}
                                                        onSelect={() => {
                                                            form.setValue("locationId", loc.id, { shouldDirty: true, shouldTouch: true });
                                                            setOpenLocation(false);
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4 shrink-0",
                                                                form.watch("locationId") === loc.id ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        <div style={{ marginLeft: loc.level * 16 }} className="flex items-center gap-2 truncate">
                                                            {(() => {
                                                                if (loc.icon) {
                                                                    const { icon: Icon, color } = LOCATION_ICONS[loc.icon] || LOCATION_ICONS['default'] || ITEM_ICONS['default'];
                                                                    return <Icon size={14} className={color} />;
                                                                }
                                                                return <span>{loc.type === 'Container' ? '📦' : loc.type === 'Person' ? '👤' : '🏠'}</span>
                                                            })()}
                                                            {loc.name}
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    {/* LENDING CONTEXT FIELDS */}
                    {watchedStatus === 'Lent' && (
                        <div className="animate-in slide-in-from-top-2 pt-2 border-t border-primary-200 mt-2">
                            <LendingFields form={form} contacts={serverContacts} />
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="ghost" onClick={onCancel} disabled={form.formState.isSubmitting}>Hủy bỏ</Button>
                <Button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-bold" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Đang lưu..." : (
                        <>
                            <Save className="h-4 w-4 mr-2" /> Lưu thay đổi
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
