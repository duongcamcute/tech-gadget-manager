"use client";

import { useState, useEffect } from "react";
import * as React from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createItem } from "@/app/actions";
import { ITEM_TYPES } from "@/lib/constants/options";
import { ItemSchema, ItemFormData } from "@/types/schema";
import { LendingFields } from "./LendingFields";
import { SpecInput } from "./SpecInput";
import { TECH_SUGGESTIONS } from "@/lib/constants";
import { Button, Input, Label, Select, Card, CardHeader, CardTitle, CardContent } from "@/components/ui/primitives";
import { Loader2, Wand2, RefreshCcw, Calendar, ExternalLink, MapPin, Clock, Tag, Box, Copy, Zap, Save, Trash2, Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { AutoCompleteInput } from "@/components/ui/AutoCompleteInput";
import { ColorPicker } from "@/components/ui/ColorPicker";
import { IconSelect } from "@/components/ui/IconSelect";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn, buildLocationTree } from "@/lib/utils";
import { LOCATION_ICONS, ITEM_ICONS } from "@/lib/constants/options";

import { optimizeImage, formatBytes, getBase64Size } from "@/lib/imageUtils";

const COLORS = [
    { name: 'Đen', hex: '#000000', class: 'bg-black' },
    { name: 'Trắng', hex: '#ffffff', class: 'bg-white border border-gray-200' },
    { name: 'Xám', hex: '#6b7280', class: 'bg-gray-500' },
    { name: 'Đỏ', hex: '#ef4444', class: 'bg-red-500' },
    { name: 'Xanh Dương', hex: '#3b82f6', class: 'bg-blue-500' },
    { name: 'Xanh Lá', hex: '#22c55e', class: 'bg-green-500' },
    { name: 'Vàng', hex: '#eab308', class: 'bg-yellow-500' },
    { name: 'Cam', hex: '#f97316', class: 'bg-orange-500' },
    { name: 'Tím', hex: '#a855f7', class: 'bg-purple-500' },
    { name: 'Hồng', hex: '#ec4899', class: 'bg-pink-500' },
    { name: 'Bạc', hex: '#d1d5db', class: 'bg-gray-300' },
    { name: 'Vàng Đồng', hex: '#b45309', class: 'bg-amber-700' },
];

const VN_TEMPLATES = [
    { label: "Cáp sạc nhanh (USB4)", category: "Data", apply: () => ({ type: "Cable", category: "Data", specs: { bandwidth: "40 Gbps (USB4/TB3/TB4)", power: "240W (PD 3.1)", interface: "USB-C", cableType: "All" } }) },
    { label: "Cáp Thunderbolt 4", category: "Data", apply: () => ({ type: "Cable", category: "Data", brand: "Apple", specs: { bandwidth: "40 Gbps (USB4/TB3/TB4)", power: "100W", interface: "USB-C", cableType: "Data" } }) },
    { label: "Củ sạc iPhone (20W)", category: "Charging", apply: () => ({ type: "Charger", category: "Charging", brand: "Apple", specs: { power: "20W", ports: "1C" } }) },
    { label: "Củ sạc MacBook (140W)", category: "Charging", apply: () => ({ type: "Charger", category: "Charging", brand: "Apple", specs: { power: "140W (PD 3.1)", technology: "GaN" } }) },
    { label: "Sạc dự phòng (10k mAh)", category: "Charging", apply: () => ({ type: "PowerBank", category: "Charging", specs: { capacity: "10000 mAh", power: "30W" } }) },
    { label: "Ổ cứng SSD Di động", category: "Data", apply: () => ({ type: "Storage", category: "Data", specs: { capacity: "1 TB", interface: "USB 3.2 Gen 2" } }) },
    { label: "Chuột không dây (Logitech)", category: "Peripheral", apply: () => ({ type: "Peripheral", category: "Accessory", brand: "Logitech", specs: { connectivity: "Bluetooth/Receiver", dpi: "8000" } }) },
    { label: "Bàn phím cơ (Keychron)", category: "Peripheral", apply: () => ({ type: "Peripheral", category: "Accessory", brand: "Keychron", specs: { switch: "Brown", connectivity: "Wireless/Wired" } }) },
    { label: "Tai nghe chống ồn (Sony)", category: "Audio", apply: () => ({ type: "Audio", category: "Accessory", brand: "Sony", specs: { type: "Over-ear", feature: "ANC" } }) },
    { label: "Hub USB-C (8-in-1)", category: "Adapter", apply: () => ({ type: "Adapter", category: "Accessory", specs: { ports: "HDMI, USB-A, SD, PD", power: "100W Pass-through" } }) },
    { label: "Màn hình 4K (Dell)", category: "Monitor", apply: () => ({ type: "Other", category: "Hardware", brand: "Dell", specs: { size: "27 inch", resolution: "4K", panel: "IPS" } }) },
];

const formatMoney = (value: string | number) => {
    if (!value) return "";
    return new Intl.NumberFormat('vi-VN').format(Number(value));
};

interface SmartAddFormProps {
    locations: any[];
    onSuccess?: () => void;
}

export function SmartAddForm({ locations, onSuccess }: SmartAddFormProps) {
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [warrantyMonths, setWarrantyMonths] = React.useState<string>("");
    const [serverBrands, setServerBrands] = React.useState<any[]>([]);
    const [serverContacts, setServerContacts] = React.useState<any[]>([]);
    const [imgPreview, setImgPreview] = React.useState<string | null>(null);
    const [customTemplates, setCustomTemplates] = React.useState<any[]>([]);

    // New States
    const [quantity, setQuantity] = React.useState(1);
    const [displayPrice, setDisplayPrice] = React.useState("");
    const [openType, setOpenType] = React.useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();
    const cloneId = searchParams.get("clone");
    const { toast } = useToast();

    // Fetch Auto-complete Data & Clone Data
    React.useEffect(() => {
        import("@/app/actions").then(mod => {
            mod.getBrands().then(setServerBrands);
            mod.getContacts().then(setServerContacts);
            // @ts-ignore
            if (mod.getTemplates) mod.getTemplates().then(setCustomTemplates);

            // Handle Clone
            if (cloneId) {
                mod.getItem(cloneId).then((item) => {
                    if (item) {
                        // @ts-ignore
                        const { id, createdAt, updatedAt, history, location, lendingRecords, ...rest } = item;

                        let parsedSpecs = {};
                        try {
                            parsedSpecs = typeof rest.specs === 'string' ? JSON.parse(rest.specs) : rest.specs;
                        } catch { }

                        // Populate form with cloned data
                        form.reset({
                            ...rest,
                            specs: parsedSpecs,
                            purchaseDate: rest.purchaseDate ? new Date(rest.purchaseDate).toISOString().split('T')[0] : null,
                            warrantyEnd: rest.warrantyEnd ? new Date(rest.warrantyEnd).toISOString().split('T')[0] : null,
                            locationId: rest.locationId || undefined // Ensure undefined if null
                        });
                        setImgPreview(rest.image || null);
                        if (rest.purchasePrice) setDisplayPrice(formatMoney(rest.purchasePrice));

                        toast("📋 Đã sao chép thông tin thiết bị!", "info");
                        router.replace("/"); // Clear param
                    }
                });
            }
        });
    }, [cloneId]);

    // --- Dynamic Item Types ---
    const [availableItemTypes, setAvailableItemTypes] = useState<any[]>([...ITEM_TYPES]);
    const [openLocation, setOpenLocation] = useState(false);
    const flatLocations = React.useMemo(() => buildLocationTree(locations || []), [locations]);

    useEffect(() => {
        const loadTypes = async () => {
            try {
                const { getItemTypes } = await import("@/app/actions");
                const dynamicTypes = await getItemTypes();
                if (dynamicTypes && dynamicTypes.length > 0) {
                    // Merge dynamic types, ensuring no duplicates if value conflicts (priority to dynamic?)
                    // Actually, simple concat is fine, usually dynamic types are new.
                    // Or we can filter out duplicates.
                    const combined = [...ITEM_TYPES, ...dynamicTypes];
                    // Remove duplicates by value just in case
                    const unique = combined.filter((v, i, a) => a.findIndex(t => t.value === v.value) === i);
                    setAvailableItemTypes(unique);
                }
            } catch (e) {
                console.error("Failed to load dynamic item types", e);
            }
        };
        loadTypes();
    }, []);

    const form = useForm({
        resolver: zodResolver(ItemSchema),
        defaultValues: {
            status: "Available",
            specs: {},
            locationId: "",
            purchaseDate: null,
            brand: "",
            model: "",
            color: "",
            purchaseLocation: "Shopee",
            image: "",
            borrowDate: new Date().toISOString().split('T')[0] // Default to today
        },
    });

    const watchedType = useWatch({ control: form.control, name: "type" });
    const watchedStatus = useWatch({ control: form.control, name: "status" });
    const watchedPurchaseDate = useWatch({ control: form.control, name: "purchaseDate" });
    const watchedColor = useWatch({ control: form.control, name: "color" });

    // Auto-calculate Warranty
    React.useEffect(() => {
        if (watchedPurchaseDate && warrantyMonths) {
            const months = parseInt(warrantyMonths);
            if (!isNaN(months)) {
                // @ts-ignore
                const start = new Date(watchedPurchaseDate);
                const end = new Date(start.setMonth(start.getMonth() + months));
                form.setValue("warrantyEnd", end);
            }
        }
    }, [watchedPurchaseDate, warrantyMonths, form]);

    const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        const stdTemplate = VN_TEMPLATES.find((t) => t.label === val);
        if (stdTemplate) {
            // @ts-ignore
            const defaults = stdTemplate.apply();
            form.reset({ ...form.getValues(), ...defaults } as any);
            toast(`⚡ Đã áp dụng mẫu: ${val}`, "info");
            return;
        }
        const custTemplate = customTemplates.find((t) => t.id === val);
        if (custTemplate) {
            try {
                const config = JSON.parse(custTemplate.config);
                form.reset({ ...form.getValues(), ...config } as any);
                toast(`⚡ Đã áp dụng mẫu: ${custTemplate.name}`, "info");
            } catch (e) {
                toast("Lỗi áp dụng mẫu", "error");
            }
        }
    };

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

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, "");
        if (raw) {
            setDisplayPrice(formatMoney(raw));
            form.setValue("purchasePrice", raw); // Store as string/number in form
        } else {
            setDisplayPrice("");
            form.setValue("purchasePrice", "");
        }
    };

    async function onSubmit(data: ItemFormData) {
        setIsSubmitting(true);
        try {
            if (quantity > 1) {
                // Batch Creation
                let successCount = 0;
                for (let i = 1; i <= quantity; i++) {
                    const itemData = {
                        ...data,
                        name: `${data.name} #${i}`, // Auto-numbering
                    };
                    const result = await createItem(itemData);
                    if (result.success) successCount++;
                }
                if (successCount === quantity) {
                    toast(`✅ Đã tạo ${successCount} thiết bị thành công!`, "success");
                    handleReset();
                } else {
                    toast(`⚠️ Chỉ tạo được ${successCount}/${quantity} thiết bị.`, "info");
                }
            } else {
                // Single Creation
                const result = await createItem(data);
                if (result.success) {
                    toast(`✅ Đã lưu ${data.name}`, "success");
                    handleReset();
                } else {
                    toast("❌ " + result.error, "error");
                }
            }
            router.refresh();
            onSuccess?.();
        } catch (e) {
            toast("Lỗi kết nối máy chủ.", "error");
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleReset = () => {
        form.reset({
            name: '',
            type: '',
            category: '',
            model: '',
            serialNumber: '',
            status: "Available",
            specs: {},
            locationId: "",
            brand: "",
            color: "",
            image: "",
            purchasePrice: null,
            purchaseDate: null,
            purchaseLocation: "Shopee",
            purchaseUrl: "",
            notes: "",
            borrowerName: "",
            borrowDate: new Date().toISOString().split('T')[0],
            dueDate: null,
        } as any);
        setWarrantyMonths("");
        setImgPreview(null);
        setQuantity(1);
        setDisplayPrice("");
    }

    // Suggestions Arrays
    const brandSuggestions = [...serverBrands.map(b => b.name), ...TECH_SUGGESTIONS.brands];

    const handleSaveAsTemplate = async () => {
        const currentValues = form.getValues();
        const templateName = prompt("Nhập tên cho mẫu mới:", `${currentValues.name || 'Mẫu mới'}`);
        if (!templateName) return;

        // Construct Config - Save all relevant fields for a complete template
        const configObj = {
            name: currentValues.name || '',
            type: currentValues.type,
            category: currentValues.category,
            brand: currentValues.brand,
            model: currentValues.model,
            specs: currentValues.specs,
            image: currentValues.image,
            color: currentValues.color,
            purchaseLocation: currentValues.purchaseLocation,
        };
        const configStr = JSON.stringify(configObj);

        try {
            // Dynamically import to avoid server/client issues if not handled
            const { createTemplate } = await import("@/app/actions");
            const res = await createTemplate({ name: templateName, category: "Custom", config: configStr });
            if (res.success) {
                toast(`Đã lưu mẫu "${templateName}"`, "success");
                // Refresh templates
                import("@/app/actions").then(mod => {
                    // @ts-ignore
                    if (mod.getTemplates) mod.getTemplates().then(setCustomTemplates);
                });
            } else {
                toast("Lỗi lưu mẫu: " + res.error, "error");
            }
        } catch (e) {
            toast("Lỗi hệ thống", "error");
        }
    };

    return (
        <Card className="shadow-lg border-0 ring-1 ring-primary-100 dark:ring-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-primary-50 dark:border-gray-800/50">
                <CardTitle className="flex items-center gap-2 text-primary-600">
                    <Wand2 className="h-5 w-5" />
                    Thêm thiết bị mới
                </CardTitle>
                <div className="flex items-center gap-2">
                    {/* Quantity Input */}
                    <div className="flex items-center bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg px-2 h-8">
                        <Copy className="h-3 w-3 text-gray-500 mr-2" />
                        <span className="text-xs text-gray-500 mr-2 font-medium">Số lượng:</span>
                        <input
                            type="number"
                            min="1"
                            max="50"
                            value={quantity}
                            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                            className="w-8 bg-transparent text-sm font-bold text-center border-none focus:ring-0 p-0 text-gray-900 dark:text-gray-100"
                        />
                    </div>
                    <Button type="button" variant="ghost" onClick={handleReset} className="h-8 w-8 p-0 text-primary-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30" title="Nhập lại từ đầu">
                        <RefreshCcw className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="pt-5">
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

                    {/* Template Quick Select */}
                    <div className="bg-primary-50/50 dark:bg-primary-900/20 p-1.5 rounded-xl border border-primary-100 dark:border-primary-900/40 flex items-center gap-2">
                        <span className="text-[10px] font-bold text-primary-500 dark:text-primary-400 uppercase px-2 whitespace-nowrap">⚡ Mẫu nhanh</span>
                        <Select onChange={handleTemplateChange} className="bg-transparent border-0 h-8 text-sm focus:ring-0 text-gray-700 dark:text-gray-300 font-medium flex-1">
                            <option value="">-- Chọn để điền tự động --</option>
                            {VN_TEMPLATES.map((t) => (
                                <option key={t.label} value={t.label}>{t.label}</option>
                            ))}
                            {customTemplates.length > 0 && <optgroup label="Mẫu của tôi">
                                {customTemplates.map((t) => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </optgroup>}
                        </Select>
                        <Button type="button" size="sm" variant="ghost" className="h-8 text-xs text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/40 px-2" onClick={handleSaveAsTemplate} title="Lưu cấu hình hiện tại thành mẫu mới">
                            <Save className="h-3.5 w-3.5 mr-1" /> Lưu mẫu
                        </Button>
                    </div>

                    {/* Datalists for Autocomplete */}
                    <datalist id="list-contacts">{serverContacts.map(c => <option key={c.id} value={c.name} />)}</datalist>
                    {/* Colors datalist removed in favor of Palette */}
                    {/* Datalists for specs are replaced by AutoCompleteInput */}

                    {/* Image Upload Area */}
                    <div className="flex items-center gap-4">
                        <div className={`h-16 w-16 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-800 ${imgPreview ? 'border-primary-500' : 'border-gray-200 dark:border-gray-700'}`}>
                            {imgPreview ? (
                                <img src={imgPreview} alt="Preview" className="h-full w-full object-cover" />
                            ) : (
                                <Box className="h-6 w-6 text-gray-300" />
                            )}
                        </div>
                        <div className="flex-1">
                            <Label className="text-xs">Ảnh thiết bị (Tùy chọn)</Label>
                            <Input type="file" accept="image/*" onChange={handleImageChange} className="mt-1 h-9 text-xs file:hidden" />
                        </div>
                    </div>

                    {/* Main Info */}
                    <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-12 md:col-span-8 space-y-1.5">
                            <Label>Tên thiết bị <span className="text-red-400">*</span></Label>
                            <Input {...form.register("name")} placeholder="VD: Dây sạc Anker, Chuột Logitech..." className="h-10 text-base font-medium focus:border-primary-500" />
                            {form.formState.errors.name && <p className="text-[10px] text-red-500">{form.formState.errors.name.message}</p>}
                        </div>
                        <div className="col-span-12 md:col-span-4 space-y-1.5">
                            <Label>Hãng (Brand)</Label>
                            <AutoCompleteInput
                                suggestions={brandSuggestions}
                                value={form.watch('brand') || ''}
                                onValueChange={(val) => form.setValue('brand', val)}
                                placeholder="Chọn hoặc nhập..."
                                className="h-10"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-1.5 col-span-2 lg:col-span-1">
                            <Label>Loại <span className="text-red-400">*</span></Label>
                            <Popover open={openType} onOpenChange={setOpenType}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openType}
                                        className="w-full justify-between bg-white dark:bg-gray-800 h-10 font-normal px-3 border-gray-200 dark:border-gray-700"
                                    >
                                        <span className="truncate">
                                            {watchedType
                                                ? availableItemTypes.find((type) => type.value === watchedType)?.label
                                                : "Chọn loại..."}
                                        </span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[280px] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Tìm loại thiết bị..." />
                                        <CommandList>
                                            <CommandEmpty>Không tìm thấy loại này.</CommandEmpty>
                                            <CommandGroup className="max-h-[300px] overflow-y-auto">
                                                {availableItemTypes.map((type) => (
                                                    <CommandItem
                                                        key={type.value}
                                                        value={type.label}
                                                        onSelect={(currentValue) => {
                                                            // We search by label but store value
                                                            form.setValue("type", type.value);
                                                            setOpenType(false);
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                watchedType === type.value ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        {type.label}
                                                        <span className="ml-auto text-[10px] text-gray-400 opacity-70 border px-1 rounded bg-gray-50">{type.value}</span>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            {/* Hidden input to ensure form validation if needed, though react-hook-form setValue handles it */}
                            <input {...form.register("type")} type="hidden" />
                        </div>

                        <div className="space-y-1.5 col-span-2 lg:col-span-1">
                            <Label>Icon / Danh mục</Label>
                            <IconSelect
                                value={form.watch("category") || ""}
                                onValueChange={(val) => form.setValue("category", val)}
                            />
                        </div>

                        {/* Color Picker */}
                        <div className="space-y-1.5 col-span-2 lg:col-span-1">
                            <Label>Màu sắc</Label>
                            <ColorPicker
                                value={watchedColor || ''}
                                onChange={(val) => form.setValue('color', val)}
                                className="h-10 w-full"
                            />
                            <input {...form.register("color")} type="hidden" />
                        </div>

                        <div className="space-y-1.5 col-span-2 lg:col-span-1">
                            <Label>Model (Mã)</Label>
                            <Input {...form.register("model")} placeholder="A2337..." className="h-10 font-mono text-sm" />
                        </div>
                        <div className="space-y-1.5 col-span-2 lg:col-span-1">
                            <Label>Serial Number</Label>
                            <Input {...form.register("serialNumber")} placeholder="S/N..." className="h-10 font-mono text-sm" />
                        </div>
                        <div className="space-y-1.5 col-span-2 lg:col-span-1">
                            <Label>Trạng thái</Label>
                            <Select {...form.register("status")} className="bg-white dark:bg-gray-800 focus:border-primary-500 h-10 border-gray-200 dark:border-gray-700">
                                <option value="Available">Sẵn sàng</option>
                                <option value="InUse">Đang dùng</option>
                                <option value="Lent">Cho mượn</option>
                                <option value="Damaged">Hư hỏng</option>
                                <option value="Lost">Thất lạc</option>
                            </Select>
                        </div>
                    </div>

                    {/* LENDING FIELDS ON CREATE */}
                    {watchedStatus === 'Lent' && (
                        <LendingFields form={form} contacts={serverContacts} />
                    )}

                    <div className="space-y-1.5">
                        <Label className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary-500" /> Vị trí lưu trữ</Label>
                        <Popover open={openLocation} onOpenChange={setOpenLocation}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openLocation}
                                    className="w-full justify-between bg-white dark:bg-gray-800 h-10 font-normal px-3 border-gray-200 dark:border-gray-700"
                                >
                                    <span className="truncate">
                                        {form.watch("locationId")
                                            ? flatLocations.find((l) => l.id === form.watch("locationId"))?.name
                                            : "-- Chưa xác định --"}
                                    </span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Tìm vị trí..." />
                                    <CommandList>
                                        <CommandEmpty>Không tìm thấy vị trí.</CommandEmpty>
                                        <CommandGroup className="max-h-[300px] overflow-y-auto">
                                            {flatLocations.map((loc) => (
                                                <CommandItem
                                                    key={loc.id}
                                                    value={loc.name}
                                                    onSelect={() => {
                                                        form.setValue("locationId", loc.id);
                                                        setOpenLocation(false);
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4 shrink-0",
                                                            form.watch("locationId") === loc.id ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    <div style={{ marginLeft: (loc.level || 0) * 16 }} className="flex items-center gap-2 truncate">
                                                        {(() => {
                                                            if (loc.icon && typeof loc.icon === 'string') {
                                                                const { icon: Icon, color } = LOCATION_ICONS[loc.icon] || LOCATION_ICONS['default'] || ITEM_ICONS['default'];
                                                                return <Icon size={14} className={color} />;
                                                            }
                                                            return <span>{loc.type === 'Container' ? '📦' : loc.type === 'Person' ? '👤' : '🏠'}</span>;
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

                    {/* Dynamic Specs Section - Richer */}
                    <div className="bg-slate-50 dark:bg-gray-950/20 p-4 rounded-xl border border-slate-200/60 dark:border-gray-800 shadow-inner">
                        {watchedType === 'Cable' ? (
                            <div className="space-y-3">
                                <Label className="text-xs uppercase font-bold text-slate-500 dark:text-gray-400 border-b border-slate-200 dark:border-gray-800 pb-2 mb-2 flex items-center gap-2">
                                    <Zap className="h-3 w-3 text-yellow-500" /> Thông số Kỹ thuật Cáp
                                </Label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Chức năng</Label>
                                        <Select {...form.register("specs.cableType")} className="h-9 text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                            <option value="All">Sạc + Dữ Liệu (Full)</option>
                                            <option value="Charging">Chuyên Sạc (Charging Only)</option>
                                            <option value="Data">Chuyên Dữ Liệu</option>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Độ dài</Label>
                                        <Input {...form.register("specs.length")} placeholder="1m..." className="h-9 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Chuẩn kết nối</Label>
                                        <AutoCompleteInput
                                            suggestions={TECH_SUGGESTIONS.interfaces}
                                            value={form.watch('specs.interface') || ''}
                                            onValueChange={(v) => form.setValue('specs.interface', v)}
                                            placeholder="USB-C..."
                                            className="h-9 bg-white"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Tốc độ / Băng thông</Label>
                                        <AutoCompleteInput
                                            suggestions={TECH_SUGGESTIONS.bandwidths}
                                            value={form.watch('specs.bandwidth') || ''}
                                            onValueChange={(v) => form.setValue('specs.bandwidth', v)}
                                            placeholder="40 Gbps..."
                                            className="h-9 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                        />
                                    </div>
                                    <div className="space-y-1 col-span-2">
                                        <Label className="text-xs">Công suất tải</Label>
                                        <AutoCompleteInput
                                            suggestions={TECH_SUGGESTIONS.powers}
                                            value={form.watch('specs.power') || ''}
                                            onValueChange={(v) => form.setValue('specs.power', v)}
                                            placeholder="100W..."
                                            className="h-9 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : watchedType === 'Storage' ? (
                            <div className="space-y-3">
                                <Label className="text-xs uppercase font-bold text-slate-500 dark:text-gray-400 border-b border-slate-200 dark:border-gray-800 pb-2 mb-2 flex items-center gap-2">
                                    <Box className="h-3 w-3 text-purple-500" /> Thông số Lưu trữ
                                </Label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Dung lượng</Label>
                                        <AutoCompleteInput
                                            suggestions={TECH_SUGGESTIONS.capacities}
                                            value={form.watch('specs.capacity') || ''}
                                            onValueChange={(v) => form.setValue('specs.capacity', v)}
                                            placeholder="1 TB..."
                                            className="h-9 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Chuẩn kết nối</Label>
                                        <AutoCompleteInput
                                            suggestions={TECH_SUGGESTIONS.interfaces}
                                            value={form.watch('specs.interface') || ''}
                                            onValueChange={(v) => form.setValue('specs.interface', v)}
                                            placeholder="USB-C..."
                                            className="h-9 bg-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <Label className="text-xs uppercase font-bold text-slate-500 dark:text-gray-400 border-b border-slate-200 dark:border-gray-800 pb-2 mb-2 flex items-center gap-2">
                                    <Tag className="h-3 w-3" /> Thông số chung
                                </Label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Công suất / Dung lượng</Label>
                                        <AutoCompleteInput
                                            suggestions={TECH_SUGGESTIONS.powers}
                                            value={form.watch('specs.power') || ''}
                                            onValueChange={(v) => form.setValue('specs.power', v)}
                                            placeholder="Nhập thông số..."
                                            className="h-9 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Tính năng khác</Label>
                                        <Input {...form.register("specs.other")} placeholder="..." className="h-9 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Purchase Info - Collapsible-ish look */}
                    <div className="space-y-3 pt-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-xs flex items-center gap-1 text-muted-foreground"><Calendar className="h-3 w-3" /> Ngày mua</Label>
                                <Input type="date" {...form.register("purchaseDate")} className="h-9" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs flex items-center gap-1 text-muted-foreground"><Tag className="h-3 w-3" /> Giá mua (VNĐ)</Label>
                                <Input
                                    type="text"
                                    value={displayPrice}
                                    onChange={handlePriceChange}
                                    placeholder="1.000.000..."
                                    className="h-9"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" /> Bảo hành</Label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="no-warranty"
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setWarrantyMonths("");
                                                form.setValue("warrantyEnd", null);
                                            }
                                        }}
                                        className="h-4 w-4 rounded border-gray-300"
                                    />
                                    <label htmlFor="no-warranty" className="text-xs text-gray-600 dark:text-gray-400">Không bảo hành</label>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" /> Bảo hành (Tháng)</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="number"
                                        placeholder="Nhập..."
                                        className="h-9 w-20"
                                        value={warrantyMonths}
                                        onChange={(e) => setWarrantyMonths(e.target.value)}
                                    />
                                    <Select
                                        className="h-9 flex-1 bg-white dark:bg-gray-800 text-xs border-gray-200 dark:border-gray-700"
                                        onChange={(e) => {
                                            if (e.target.value) setWarrantyMonths(e.target.value);
                                        }}
                                        value={""} // Reset after select implies? Or keep uncontrolled-ish
                                    >
                                        <option value="">Chọn nhanh...</option>
                                        <option value="6">6 Tháng</option>
                                        <option value="12">12 Tháng</option>
                                        <option value="18">18 Tháng</option>
                                        <option value="24">24 Tháng (2 Năm)</option>
                                        <option value="36">36 Tháng (3 Năm)</option>
                                    </Select>
                                </div>
                                {form.watch("warrantyEnd") && <div className="text-[10px] text-green-600 font-bold text-right">Đến: {new Date(form.watch("warrantyEnd")!).toLocaleDateString('vi-VN')}</div>}
                            </div>
                            <div className="space-y-1 col-span-2">
                                <Label className="text-xs flex items-center gap-1 text-muted-foreground"><ExternalLink className="h-3 w-3" /> Nơi mua</Label>
                                <div className="flex gap-2">
                                    <Input {...form.register("purchaseLocation")} placeholder="Shop..." className="h-9 flex-1" />
                                    <Input {...form.register("purchaseUrl")} placeholder="Link..." className="h-9 flex-[2]" />
                                </div>
                            </div>
                            <div className="col-span-2 space-y-1">
                                <Label className="text-xs text-muted-foreground">Ghi chú</Label>
                                <Input {...form.register("notes")} placeholder="Ghi chú thêm..." className="h-9" />
                            </div>
                        </div>

                        {/* Dynamic Extra Specs for ALL Types */}
                        <div className="pt-2 border-t border-dashed mt-2">
                            <Label className="text-xs font-bold text-gray-500 mb-2 block">Thêm thông số khác</Label>
                            <div className="space-y-2">
                                {Object.entries(form.watch('specs') || {}).filter(([k]) => !['capacity', 'interface', 'bandwidth', 'power', 'ports', 'cableType', 'length', 'connectivity', 'dpi', 'switch', 'type', 'feature', 'resolution', 'size', 'panel', 'other'].includes(k)).map(([k, v]) => (
                                    <div key={k} className="flex gap-2 items-center">
                                        <div className="w-1/3 bg-gray-100 dark:bg-gray-800 px-2 py-1.5 rounded text-xs border border-gray-200 dark:border-gray-700 truncate font-medium text-gray-600 dark:text-gray-400">{k}</div>
                                        <Input
                                            value={v as string}
                                            onChange={(e) => {
                                                const current = form.getValues('specs');
                                                form.setValue('specs', { ...current, [k]: e.target.value });
                                            }}
                                            className="h-8 text-xs flex-1 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                        />
                                        <Button type="button" variant="ghost" size="sm" onClick={() => {
                                            const current = form.getValues('specs');
                                            const newSpecs = { ...current };
                                            delete newSpecs[k];
                                            form.setValue('specs', newSpecs);
                                        }} className="h-8 w-8 p-0 text-red-400 hover:text-red-500 hover:bg-red-50">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}

                                <SpecInput
                                    onAdd={(key, val) => {
                                        const current = form.getValues('specs') || {};
                                        form.setValue('specs', { ...current, [key]: val }, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
                                    }}
                                />
                            </div>
                        </div>
                    </div>



                    <Button type="submit" disabled={isSubmitting} className="w-full font-bold bg-primary-500 hover:bg-primary-600 text-white shadow-xl shadow-primary-500/20 hover:shadow-primary-500/30 transition-all h-12 text-base rounded-xl mt-2">
                        {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : quantity > 1 ? `Lưu ${quantity} thiết bị` : "Lưu vào kho đồ"}
                    </Button>
                </form>
            </CardContent>
        </Card >
    );
}
