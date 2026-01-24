"use client";

import { useState, useEffect } from "react";
import { X, Calendar, MapPin, History, Edit3, Trash2, Save, User, Clock, Package, ArrowRight, ArrowLeft, Copy, Plus } from "lucide-react";
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
import { ITEM_TYPES } from "@/lib/constants/options";

const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return "---";
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
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
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 line-clamp-1">{mode === 'EDIT' ? 'Chỉnh sửa thông tin' : item.name}</h2>
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

function ViewMode({ item, setMode, onDelete }: { item: any, setMode: (m: "EDIT") => void, onDelete: () => void }) {
    const { toast } = useToast();
    const styles = {
        'Available': "bg-emerald-100 text-emerald-800 border-emerald-200",
        'InUse': "bg-blue-100 text-blue-800 border-blue-200",
        'Lent': "bg-primary-100 text-primary-800 border-primary-200",
        'Lost': "bg-red-100 text-red-800 border-red-200",
    } as any;

    // Sort history: newest first
    const history = item.history ? [...item.history].sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) : [];

    return (
        <div className="grid md:grid-cols-12 min-h-full">
            {/* Left Column: Info */}
            <div className="md:col-span-7 p-6 space-y-6">

                {/* Image if exists */}
                {item.image && (
                    <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                        <img src={item.image} alt={item.name} className="w-full max-h-[350px] object-contain hover:scale-105 transition-transform duration-500" />
                    </div>
                )}

                {/* Status Bar */}
                <div className="flex items-center gap-3 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wide flex items-center gap-2 ${styles[item.status] || styles['Available']}`}>
                        {item.status === 'Available' && "Checking: Sẵn sàng"}
                        {item.status === 'InUse' && "Đang sử dụng"}
                        {item.status === 'Lent' && "Đang cho mượn"}
                        {item.status === 'Lost' && "Thất lạc"}
                    </span>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700">
                        <MapPin className="h-3.5 w-3.5 mr-1.5 text-gray-500 dark:text-gray-400" />
                        <span className="font-medium">{item.location?.name || "Chưa có vị trí"}</span>
                    </div>
                </div>

                {/* Notes Display */}
                {item.notes && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-xl border border-yellow-100 dark:border-yellow-900/20 mb-6">
                        <h3 className="text-xs font-bold text-yellow-700 dark:text-yellow-500 uppercase tracking-wider mb-2 flex items-center gap-2"><Edit3 className="h-3 w-3" /> Ghi chú</h3>
                        <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">{item.notes}</p>
                    </div>
                )}

                {/* Specs Grid */}
                <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-3">Chi tiết kỹ thuật</h3>
                    <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-gray-900/50 p-4 rounded-xl border border-slate-100 dark:border-gray-700">
                        {item.brand && <div><p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">Hãng sản xuất</p><p className="font-medium text-gray-900 dark:text-gray-100">{item.brand}</p></div>}
                        {item.model && <div><p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">Model</p><p className="font-mono font-medium text-gray-900 dark:text-gray-100">{item.model}</p></div>}
                        {/* Removed duplicate Model */}
                        {item.color && <div><p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">Màu sắc</p><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full border border-gray-300" style={{ backgroundColor: getColorHex(item.color) }}></div><p className="font-medium text-gray-900 dark:text-gray-100">{item.color}</p></div></div>}
                        {item.purchaseDate && <div><p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">Ngày mua</p><p className="font-medium text-gray-900 dark:text-gray-100">{formatDateVN(item.purchaseDate)}</p></div>}
                        {item.purchasePrice && <div><p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">Giá mua</p><p className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(item.purchasePrice)}</p></div>}
                        {item.warrantyEnd && <div><p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">Bảo hành đến</p><p className="font-medium text-green-700 dark:text-green-400">{formatDateVN(item.warrantyEnd)}</p></div>}

                        {/* Dynamic Specs */}
                        {Object.entries(item.specs ? JSON.parse(item.specs as string) : {}).map(([k, v]: any) => (
                            <div key={k} className="col-span-1">
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">{k}</p>
                                <p className="font-medium text-gray-900 dark:text-gray-100 truncate" title={v}>{v}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="pt-4 flex gap-3">
                    <Button onClick={() => setMode("EDIT")} className="flex-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm">
                        <Edit3 className="h-4 w-4 mr-2" /> Chỉnh sửa / Cập nhật
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

            {/* Right Column: History */}
            <div className="md:col-span-5 bg-gray-50/50 dark:bg-gray-800/50 border-l border-gray-100 dark:border-gray-700 p-6 overflow-y-auto max-h-[500px]">
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <History className="h-4 w-4" /> Lịch sử thiết bị
                </h3>
                <div className="relative space-y-6 pl-2">
                    {/* Line */}
                    <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-slate-200 dark:bg-slate-700" />

                    {history.map((h: any, idx: number) => (
                        <div key={h.id || idx} className="relative pl-6">
                            <div className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-gray-800 bg-primary-400 shadow-sm z-10" />
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{h.action === 'CREATED' ? 'Nhập kho' : h.action === 'MOVED' ? 'Di chuyển' : h.action === 'LENT' ? 'Cho mượn' : h.action === 'RETURNED' ? 'Đã trả lại' : 'Cập nhật'}</span>
                                <span className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{h.details}</span>
                                <span className="text-[10px] text-gray-400 font-mono mt-1">{formatDateTimeVN(h.timestamp)}</span>
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
    );
}

function EditMode({ item, locations, onCancel, onClose }: { item: any, locations: any[], onCancel: () => void, onClose: () => void }) {
    const { toast } = useToast();
    const router = useRouter();
    const [serverBrands, setServerBrands] = useState<any[]>([]);
    const [serverContacts, setServerContacts] = useState<any[]>([]);
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
            borrowerName: item.lendingRecords?.[0]?.borrowerName || ""
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

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const res = reader.result as string;
                setImgPreview(res);
                form.setValue("image", res);
            };
            reader.readAsDataURL(file);
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
                        <Select {...form.register("type")} className="bg-white dark:bg-gray-800 dark:text-gray-100">
                            <option value="Other">Khác</option>
                            {ITEM_TYPES.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </Select>
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
                            suggestions={serverBrands.map(b => b.name)}
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
                            <Label>Hết hạn bảo hành</Label>
                            <div className="flex gap-2">
                                <Input type="date" {...form.register("warrantyEnd")} className="flex-1" />
                            </div>
                            <div className="flex gap-2 mt-1 items-center">
                                <Input
                                    type="number"
                                    placeholder="Tháng..."
                                    className="h-8 w-20 text-xs"
                                    value={warrantyMonths}
                                    onChange={(e) => setWarrantyMonths(e.target.value)}
                                />
                                <Select
                                    className="h-8 flex-1 bg-white dark:bg-gray-800 text-xs"
                                    onChange={(e) => {
                                        if (e.target.value) setWarrantyMonths(e.target.value);
                                    }}
                                    value={""}
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
                        <div className="col-span-2">
                            <Label>Ghi chú</Label>
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
                                    const entries = Object.entries(currentSpecs);

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
                                                    <Button type="button" variant="ghost" className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => removeSpec(k)}>
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
                                <option value="Lost">Thất lạc (Lost)</option>
                            </Select>
                        </div>
                        <div>
                            <Label>Vị trí</Label>
                            <Select {...form.register("locationId")} className="bg-white dark:bg-gray-800 dark:text-gray-100">
                                <option value="">-- Chưa xác định --</option>
                                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                            </Select>
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
