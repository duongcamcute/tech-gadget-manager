"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { QrCode, Package, Database, Search, LayoutDashboard, Tag, Wallet, Check, X, ArrowRightLeft, List, LayoutGrid, HelpCircle, Trash2, AlertTriangle, Shield, Clock } from "lucide-react";
import { Card, Button, Input, Select } from "@/components/ui/primitives";
import { Checkbox } from "@/components/ui/Checkbox";
import { ItemDetailDialog } from "./ItemDetailDialog";
import { LocationDetailView } from "@/features/locations/LocationDetailView";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { ITEM_ICONS, ITEM_STATUS, ITEM_TYPES, LOCATION_ICONS } from "@/lib/constants/options";
import { getColorHex } from "@/lib/utils/colors";
import { QrCard } from "@/components/printing/QrCard";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { bulkMoveItems, bulkDeleteItems } from "@/app/actions";
import { bulkLendItems, lendItem, returnItem } from "@/features/lending/actions";
import { checkOverdue, getUrgencyLevel, formatOverdueStatus } from "@/lib/utils/overdueChecker";
import { checkWarranty, getWarrantyUrgency, formatWarrantyStatus } from "@/lib/utils/warrantyChecker";

function getItemIconData(item: any) {
    const type = item.category || item.type || 'Other';
    // Match partial keys like 'MacBook' -> 'Laptop' if needed, or rely on exact match
    // Simple direct match first
    if (ITEM_ICONS[type]) {
        const { icon, color, bg } = ITEM_ICONS[type];
        return { icon, color, bg };
    }

    // Fallback to type mapping
    const normalizedType = ITEM_TYPES.find(t => t.label === type || t.value === type)?.value || 'Other';
    const config = ITEM_ICONS[normalizedType] || ITEM_ICONS['default'];
    return { icon: config.icon, color: config.color, bg: config.bg };
}

function getItemStatusLabel(status: string) {
    return ITEM_STATUS[status as keyof typeof ITEM_STATUS]?.label || status;
}

function getStatusColorClasses(status: string) {
    return ITEM_STATUS[status as keyof typeof ITEM_STATUS]?.color || "bg-gray-50 text-gray-700 border-gray-200";
}

export default function InventoryManager({ initialItems, locations }: { initialItems: any[], locations: any[] }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Complex Filter State
    const [activeFilters, setActiveFilters] = useState({
        category: 'all',
        status: 'all',
        brand: 'all',
        color: 'all',
        power: 'all',
        length: 'all',
        capacity: 'all'
    });

    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [viewLocation, setViewLocation] = useState<any>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Bulk Action States
    const [isExporting, setIsExporting] = useState(false);
    const [isMoving, setIsMoving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isLending, setIsLending] = useState(false);
    const [isQrPreviewOpen, setIsQrPreviewOpen] = useState(false);

    const router = useRouter();
    const { toast } = useToast();

    // Derived Selection Helpers
    const toggleSelection = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const toggleAll = () => {
        if (selectedIds.size === filteredItems.length && filteredItems.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredItems.map(i => i.id)));
        }
    };

    // Filter Logic
    const filteredItems = useMemo(() => {
        return initialItems.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.type?.toLowerCase().includes(searchQuery.toLowerCase());

            const itemCategory = item.type || item.category;
            // Loose matching for category to handle "Cable" vs "Dây cáp"
            const matchesCategory = activeFilters.category === 'all' || itemCategory === activeFilters.category || (ITEM_TYPES.find(t => t.value === activeFilters.category)?.label === itemCategory);

            const matchesBrand = activeFilters.brand === 'all' || item.brand === activeFilters.brand;

            let matchesStatus = true;
            if (activeFilters.status === 'unsorted') {
                matchesStatus = !item.locationId;
            } else if (activeFilters.status !== 'all') {
                matchesStatus = item.status === activeFilters.status;
            }

            const matchesColor = activeFilters.color === 'all' || item.color === activeFilters.color;

            // Spec checking
            let matchesSpecs = true;
            try {
                const s = typeof item.specs === 'string' ? JSON.parse(item.specs) : item.specs || {};
                if (activeFilters.power !== 'all' && s.power !== activeFilters.power) matchesSpecs = false;
                if (activeFilters.length !== 'all' && s.length !== activeFilters.length) matchesSpecs = false;
                if (activeFilters.capacity !== 'all' && s.capacity !== activeFilters.capacity) matchesSpecs = false;
            } catch { matchesSpecs = true; }

            return matchesSearch && matchesCategory && matchesBrand && matchesStatus && matchesColor && matchesSpecs;
        });
    }, [initialItems, searchQuery, activeFilters]);

    // Dashboard Stats
    const stats = useMemo(() => {
        const lentItems = initialItems.filter(i => i.status === 'Lent');
        const overdueItems = lentItems.filter(i => {
            if (i.activeLending?.dueDate) {
                return checkOverdue(i.activeLending.dueDate).isOverdue;
            }
            return false;
        });
        // Warranty stats - items expiring within 30 days
        const warrantyExpiringItems = initialItems.filter(i => {
            if (i.warrantyEnd) {
                const info = checkWarranty(i.warrantyEnd);
                return info.isExpiringSoon || info.isExpired;
            }
            return false;
        });
        return {
            total: initialItems.length,
            value: initialItems.reduce((acc, item) => acc + (item.purchasePrice || 0), 0),
            lending: lentItems.length,
            available: initialItems.filter(i => i.status === 'Available').length,
            unsorted: initialItems.filter(i => !i.location || !i.locationId).length,
            overdue: overdueItems.length,
            warrantyExpiring: warrantyExpiringItems.length
        };
    }, [initialItems]);

    // Available Options for Filters
    const filterOptions = useMemo(() => {
        const brands = Array.from(new Set(initialItems.map(i => i.brand).filter(Boolean)));
        const colors = Array.from(new Set(initialItems.map(i => i.color).filter(Boolean)));

        // Extract specs
        const powers = new Set<string>();
        const lengths = new Set<string>();
        const capacities = new Set<string>();

        initialItems.forEach(item => {
            try {
                const s = typeof item.specs === 'string' ? JSON.parse(item.specs) : item.specs || {};
                if (s.power) powers.add(s.power);
                if (s.length) lengths.add(s.length);
                if (s.capacity) capacities.add(s.capacity);
            } catch { }
        });

        return { brands, colors, powers: Array.from(powers), lengths: Array.from(lengths), capacities: Array.from(capacities) };
    }, [initialItems]);

    // Helpers for Context-Aware Filters
    const isCategorySelected = activeFilters.category !== 'all';
    const showPower = isCategorySelected && ['Cable', 'Charger', 'PowerBank', 'Adapter', 'Củ sạc', 'Dây cáp'].some(t => activeFilters.category.includes(t));
    const showLength = isCategorySelected && ['Cable', 'Dây cáp'].some(t => activeFilters.category.includes(t));
    const showCapacity = isCategorySelected && ['PowerBank', 'Storage', 'Sạc dự phòng', 'Pin'].some(t => activeFilters.category.includes(t));

    // Bulk Actions
    const handleBulkDelete = async () => {
        if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.size} món đồ đã chọn?`)) return;
        setIsDeleting(true);
        const res = await bulkDeleteItems(Array.from(selectedIds));
        if (res.success) {
            toast(`Đã xóa ${selectedIds.size} món đồ`, "success");
            setSelectedIds(new Set());
            router.refresh();
        } else {
            toast("Lỗi: " + res.error, "error");
        }
        setIsDeleting(false);
    };

    const handleBulkMove = async (locationId: string) => {
        setIsMoving(true);
        const res = await bulkMoveItems(Array.from(selectedIds), locationId);
        if (res.success) {
            toast(`Đã chuyển ${selectedIds.size} món đồ`, "success");
            setSelectedIds(new Set());
            router.refresh();
        } else {
            toast("Lỗi: " + res.error, "error");
        }
        setIsMoving(false);
    };

    const handleQrExport = () => {
        // Placeholder for actual export logic if needed or reused
        setIsQrPreviewOpen(true);
    };

    return (
        <div className="h-full flex flex-col gap-4 p-4 max-w-[1600px] mx-auto w-full pb-24">
            <ItemDetailDialog
                item={selectedItem}
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
                locations={locations}
            />

            {/* Header Title Only */}
            <div className="flex flex-col gap-2 p-2">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">Kho thiết bị</h1>
                <p className="text-gray-500 dark:text-gray-400">Quản lý toàn bộ {initialItems.length} thiết bị trong kho của bạn</p>
            </div>

            {/* Dashboard Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 select-none">
                <div onClick={() => setActiveFilters(prev => ({ ...prev, status: 'all' }))} className={`cursor-pointer bg-gradient-to-br from-primary-500 to-primary-600 p-5 rounded-2xl text-white shadow-lg shadow-primary-500/20 transition-all active:scale-95 ${activeFilters.status === 'all' ? 'ring-2 ring-offset-2 ring-primary-500' : 'opacity-90 hover:opacity-100'}`}>
                    <div className="flex items-center gap-2 opacity-80 mb-1 whitespace-nowrap"><LayoutDashboard className="h-4 w-4" /> Tổng giá trị</div>
                    <div className="text-3xl font-bold tracking-tight">
                        {(() => {
                            const val = stats.value;
                            if (val >= 1000000) return `${(val / 1000000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} Triệu`;
                            if (val >= 1000) return `${(val / 1000).toLocaleString('vi-VN', { maximumFractionDigits: 0 })} Nghìn`;
                            return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
                        })()}
                    </div>
                    <div className="text-[10px] opacity-70 mt-1 font-medium whitespace-nowrap">{stats.total} thiết bị</div>
                </div>

                <div onClick={() => setActiveFilters(prev => ({ ...prev, status: 'Available' }))} className={`cursor-pointer bg-white dark:bg-gray-800 p-5 rounded-2xl border border-blue-100 dark:border-blue-900 shadow-sm transition-all active:scale-95 ${activeFilters.status === 'Available' ? 'ring-2 ring-offset-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'hover:border-blue-300 dark:hover:border-blue-700'}`}>
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1 font-medium whitespace-nowrap"><Check className="h-4 w-4" /> Sẵn sàng</div>
                    <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stats.available}</div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 font-medium">Có thể sử dụng ngay</div>
                </div>

                <div onClick={() => setActiveFilters(prev => ({ ...prev, status: 'Lent' }))} className={`cursor-pointer bg-white dark:bg-gray-800 p-5 rounded-2xl border border-purple-100 dark:border-purple-900 shadow-sm transition-all active:scale-95 ${activeFilters.status === 'Lent' ? 'ring-2 ring-offset-2 ring-purple-500 bg-purple-50 dark:bg-purple-900/30' : 'hover:border-purple-300 dark:hover:border-purple-700'}`}>
                    <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1 font-medium whitespace-nowrap"><ArrowRightLeft className="h-4 w-4" /> Đang cho mượn</div>
                    <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stats.lending}</div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 font-medium">Đang được sử dụng</div>
                </div>

                {/* Unsorted Items Card */}
                <div onClick={() => setActiveFilters(prev => ({ ...prev, status: 'unsorted' }))} className={`cursor-pointer bg-white dark:bg-gray-800 p-5 rounded-2xl border border-amber-100 dark:border-amber-900 shadow-sm transition-all active:scale-95 ${activeFilters.status === 'unsorted' ? 'ring-2 ring-offset-2 ring-amber-500 bg-amber-50 dark:bg-amber-900/30' : 'hover:border-amber-300 dark:hover:border-amber-700'}`}>
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1 font-medium whitespace-nowrap"><HelpCircle className="h-4 w-4" /> Chưa phân loại</div>
                    <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stats.unsorted}</div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 font-medium">Cần sắp xếp vị trí</div>
                </div>

                {/* Overdue Alert Card */}
                {stats.overdue > 0 && (
                    <div className="cursor-pointer bg-gradient-to-br from-red-500 to-red-600 p-5 rounded-2xl text-white shadow-lg shadow-red-500/20 transition-all active:scale-95 animate-pulse">
                        <div className="flex items-center gap-2 opacity-90 mb-1 font-medium whitespace-nowrap"><AlertTriangle className="h-4 w-4" /> Quá hạn!</div>
                        <div className="text-2xl font-bold">{stats.overdue}</div>
                        <div className="text-[10px] opacity-80 mt-1 font-medium">Cần thu hồi gấp</div>
                    </div>
                )}

                {/* Warranty Expiring Card */}
                {stats.warrantyExpiring > 0 && (
                    <div className="cursor-pointer bg-gradient-to-br from-amber-500 to-orange-500 p-5 rounded-2xl text-white shadow-lg shadow-amber-500/20 transition-all active:scale-95">
                        <div className="flex items-center gap-2 opacity-90 mb-1 font-medium whitespace-nowrap"><Shield className="h-4 w-4" /> Bảo hành</div>
                        <div className="text-2xl font-bold">{stats.warrantyExpiring}</div>
                        <div className="text-[10px] opacity-80 mt-1 font-medium">Sắp hết hạn (30 ngày)</div>
                    </div>
                )}

            </div>

            {/* Static Filters & View Toggle - NOT Sticky and NO specific white fix */}
            <div className="space-y-2 md:space-y-3 bg-gray-50/50 dark:bg-gray-800/50 p-2 md:p-3 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Tìm kiếm thiết bị, mã, hãng..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 dark:text-gray-100 rounded-xl"
                        />
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className={`rounded-xl border-gray-200 dark:border-gray-600 ${isFilterOpen ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border-primary-200 dark:border-primary-700' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}
                    >
                        <List className="h-4 w-4 mr-2" /> Bộ lọc
                    </Button>
                </div>

                {/* Collapsible Filters */}
                {isFilterOpen && (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 animate-in slide-in-from-top-2 fade-in duration-200">
                        <Select value={activeFilters.category} onChange={(e: any) => setActiveFilters(prev => ({ ...prev, category: e.target.value }))} className="w-full bg-white dark:bg-gray-800 dark:text-gray-100 rounded-xl text-xs h-9">
                            <option value="all">Tất cả loại</option>
                            {ITEM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </Select>
                        <Select value={activeFilters.brand} onChange={(e: any) => setActiveFilters(prev => ({ ...prev, brand: e.target.value }))} className="w-full bg-white dark:bg-gray-800 dark:text-gray-100 rounded-xl text-xs h-9">
                            <option value="all">Tất cả hãng</option>
                            {filterOptions.brands.map(b => <option key={b} value={b}>{b}</option>)}
                        </Select>
                        <Select value={activeFilters.color} onChange={(e: any) => setActiveFilters(prev => ({ ...prev, color: e.target.value }))} className="w-full bg-white dark:bg-gray-800 dark:text-gray-100 rounded-xl text-xs h-9">
                            <option value="all">Tất cả màu</option>
                            {filterOptions.colors.map(c => <option key={c} value={c}>{c}</option>)}
                        </Select>

                        {/* Dynamic Specs Filters */}
                        {showPower && <Select value={activeFilters.power} onChange={(e: any) => setActiveFilters(prev => ({ ...prev, power: e.target.value }))} className="bg-orange-50 border-orange-200 rounded-xl text-xs h-9"><option value="all">Công suất...</option>{filterOptions.powers.map(p => <option key={p} value={p}>{p}</option>)}</Select>}
                        {showLength && <Select value={activeFilters.length} onChange={(e: any) => setActiveFilters(prev => ({ ...prev, length: e.target.value }))} className="bg-emerald-50 border-emerald-200 rounded-xl text-xs h-9"><option value="all">Độ dài...</option>{filterOptions.lengths.map(p => <option key={p} value={p}>{p}</option>)}</Select>}
                        {showCapacity && <Select value={activeFilters.capacity} onChange={(e: any) => setActiveFilters(prev => ({ ...prev, capacity: e.target.value }))} className="bg-purple-50 border-purple-200 rounded-xl text-xs h-9"><option value="all">Dung lượng...</option>{filterOptions.capacities.map(p => <option key={p} value={p}>{p}</option>)}</Select>}

                        <Button variant="ghost" onClick={() => setActiveFilters({ category: 'all', status: 'all', brand: 'all', color: 'all', power: 'all', length: 'all', capacity: 'all' })} className="text-red-500 hover:bg-red-50 hover:text-red-600 h-9 rounded-xl px-3 border border-transparent hover:border-red-100">
                            Xóa bộ lọc
                        </Button>
                    </div>
                )}
            </div>

            {/* View Toggle & Count */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2">
                <div className="flex items-center justify-between sm:justify-start gap-4">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 border-l-4 border-primary-500 pl-3 whitespace-nowrap">Danh sách thiết bị</h2>
                    <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
                        <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary-600 dark:text-primary-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}><LayoutGrid className="w-4 h-4" /></button>
                        <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary-600 dark:text-primary-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}><List className="w-4 h-4" /></button>
                    </div>
                </div>
                <div className="flex gap-2 items-center justify-between sm:justify-end">
                    <Select className="h-9 text-xs w-full sm:w-40 bg-white dark:bg-gray-800 dark:text-gray-100 rounded-xl" onChange={(e) => { if (e.target.value) setViewLocation(locations.find(l => l.id === e.target.value)); }}>
                        <option value="">Quản lý túi đồ...</option>
                        {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </Select>
                    <span className="text-[10px] sm:text-xs font-bold text-primary-600 bg-primary-50 dark:bg-primary-900/30 px-3 py-1.5 rounded-full border border-primary-100 dark:border-primary-800 whitespace-nowrap shadow-sm">
                        {filteredItems.length} kết quả
                    </span>
                </div>
            </div>

            {/* Main Content Area */}
            {viewMode === 'list' ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="px-4 py-3 w-10"><Checkbox checked={selectedIds.size === filteredItems.length && filteredItems.length > 0} onCheckedChange={toggleAll} /></th>
                                    <th className="px-4 py-3">Thiết bị</th>
                                    <th className="px-4 py-3 hidden md:table-cell">Thông số</th>
                                    <th className="px-4 py-3 hidden sm:table-cell">Vị trí</th>
                                    <th className="px-4 py-3 text-right">QR</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredItems.map(item => {
                                    const { icon: Icon, color, bg } = getItemIconData(item);
                                    const specs = typeof item.specs === 'string' ? JSON.parse(item.specs) : item.specs || {};
                                    const isSelected = selectedIds.has(item.id);

                                    return (
                                        <tr key={item.id} className={`group hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${isSelected ? 'bg-primary-50/50 dark:bg-primary-900/30' : ''}`} onClick={() => setSelectedItem(item)}>
                                            <td className="px-4 py-3" onClick={e => e.stopPropagation()}><Checkbox checked={isSelected} onCheckedChange={() => toggleSelection(item.id)} /></td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${bg} ${color}`}>
                                                        <Icon className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900 dark:text-gray-100">{item.name}</div>
                                                        <div className="flex gap-2 text-xs text-gray-500">
                                                            <span className={`${getStatusColorClasses(item.status)} px-1.5 rounded-full text-[10px] uppercase font-bold`}>{getItemStatusLabel(item.status)}</span>
                                                            {item.brand}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 hidden md:table-cell">
                                                <div className="flex flex-wrap gap-1">
                                                    {specs.power && <span className="bg-orange-50 text-orange-700 px-1.5 rounded border border-orange-100 text-[10px]">⚡ {specs.power}</span>}
                                                    {specs.length && <span className="bg-emerald-50 text-emerald-700 px-1.5 rounded border border-emerald-100 text-[10px]">📏 {specs.length}</span>}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 hidden sm:table-cell text-gray-500">
                                                {item.location ? (() => {
                                                    const LocIcon = item.location.icon && LOCATION_ICONS[item.location.icon] ? LOCATION_ICONS[item.location.icon].icon : Database;
                                                    const locColor = item.location.icon && LOCATION_ICONS[item.location.icon] ? LOCATION_ICONS[item.location.icon].color : "text-gray-400";
                                                    return (
                                                        <span className="flex items-center gap-1">
                                                            <LocIcon className={`h-3 w-3 ${locColor}`} />
                                                            {item.location.name}
                                                        </span>
                                                    );
                                                })() : '--'}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Link href={`/items/${item.id}/qr`} onClick={e => e.stopPropagation()} className="text-gray-400 hover:text-primary-600"><QrCode className="w-4 h-4 inline" /></Link>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="grid gap-3 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredItems.map(item => {
                        const { icon: Icon, color, bg } = getItemIconData(item);
                        const isSelected = selectedIds.has(item.id);
                        const specs = typeof item.specs === 'string' ? JSON.parse(item.specs) : item.specs || {};
                        const isWhite = item.color && getColorHex(item.color) === '#ffffff';

                        return (
                            <Card key={item.id} className={`group relative flex h-full min-h-[140px] bg-white dark:bg-gray-800 border-primary-100/60 dark:border-gray-700 shadow-sm hover:shadow-xl hover:shadow-primary-100/50 dark:hover:shadow-gray-900/50 hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-300 hover:-translate-y-1 rounded-2xl overflow-hidden ${isSelected ? 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-gray-900 border-primary-500' : ''}`}>
                                <div className="flex flex-row w-full">
                                    {/* Selection */}
                                    <div className={`absolute top-2 left-2 z-20 ${selectedIds.size > 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 transition-opacity duration-200'}`}>
                                        <div className="bg-white/80 backdrop-blur rounded-full p-0.5 shadow-sm">
                                            <Checkbox checked={isSelected} onCheckedChange={() => toggleSelection(item.id)} className="h-5 w-5 border-gray-400" />
                                        </div>
                                    </div>

                                    {/* QR */}
                                    <Link href={`/items/${item.id}/qr`} className="absolute top-2 right-2 z-20 p-1.5 text-gray-300 hover:text-primary-600 hover:bg-primary-50 rounded-lg" title="Xem mã QR"><QrCode className="h-4 w-4" /></Link>

                                    {/* Icon Column */}
                                    <div
                                        className={`w-28 shrink-0 flex flex-col items-center justify-center relative cursor-pointer group-hover/image overflow-hidden transition-colors duration-300 ${!item.color ? bg : ''} ${isWhite ? 'bg-white border-r border-gray-50' : ''}`}
                                        style={!isWhite && item.color ? { backgroundColor: `${getColorHex(item.color)}15` } : {}}
                                        onClick={() => setSelectedItem(item)}
                                    >
                                        <div className="transform transition-transform duration-500 group-hover:scale-110 mb-4">
                                            <Icon
                                                className={`h-12 w-12 ${!item.color ? color : ''}`}
                                                style={item.color ? { color: isWhite ? '#fbbf24' : getColorHex(item.color) } : {}}
                                            />
                                        </div>

                                        {/* Status Pill in Card */}
                                        <div className="absolute bottom-3 w-full flex justify-center px-1 z-30" onClick={(e) => e.stopPropagation()}>
                                            {item.status === 'Lent' ? (
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <div className={`cursor-pointer hover:scale-105 transition-transform text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm border bg-white/95 backdrop-blur-md whitespace-nowrap ${getStatusColorClasses(item.status)}`}>
                                                            {getItemStatusLabel(item.status)}
                                                        </div>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-2" side="top">
                                                        <Button size="sm" variant="ghost" className="h-8 text-xs w-full justify-start" onClick={async () => {
                                                            await returnItem(item.id);
                                                            toast("Đã đánh dấu đã trả!", "success");
                                                            router.refresh();
                                                        }}>
                                                            <Check className="h-3 w-3 mr-2" /> Đánh dấu đã trả
                                                        </Button>
                                                    </PopoverContent>
                                                </Popover>
                                            ) : item.status === 'Available' ? (
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <div className={`cursor-pointer hover:scale-105 transition-transform text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm border bg-white/95 backdrop-blur-md whitespace-nowrap ${getStatusColorClasses(item.status)}`}>
                                                            {getItemStatusLabel(item.status)}
                                                        </div>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-72 p-3 bg-white" side="top">
                                                        <form onSubmit={async (e) => {
                                                            e.preventDefault();
                                                            const fd = new FormData(e.currentTarget);
                                                            const borrowerName = fd.get('borrower') as string;
                                                            const dueDateStr = fd.get('dueDate') as string;
                                                            const dueDate = dueDateStr ? new Date(dueDateStr) : undefined;
                                                            if (borrowerName) {
                                                                await lendItem(item.id, borrowerName, dueDate);
                                                                toast("Đã cho mượn!", "success");
                                                                router.refresh();
                                                            }
                                                        }} className="space-y-2">
                                                            <h4 className="font-bold text-xs flex items-center gap-1"><Wallet className="h-3 w-3" /> Cho mượn thiết bị</h4>
                                                            <Input name="borrower" placeholder="Tên người mượn..." required className="h-8 text-xs" />
                                                            <div className="space-y-1">
                                                                <label className="text-[10px] text-gray-500">Ngày dự kiến trả</label>
                                                                <Input name="dueDate" type="date" className="h-8 text-xs" />
                                                            </div>
                                                            <Button type="submit" size="sm" className="w-full h-7 text-xs bg-primary-600 text-white">Xác nhận</Button>
                                                        </form>
                                                    </PopoverContent>
                                                </Popover>
                                            ) : (
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm border bg-white/95 backdrop-blur-md whitespace-nowrap ${getStatusColorClasses(item.status)}`}>
                                                    {getItemStatusLabel(item.status)}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Text Content */}
                                    <div className="p-3 flex-1 flex flex-col justify-between min-w-0" onClick={() => setSelectedItem(item)}>
                                        <div>
                                            <div className="flex gap-2 mb-1">
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold max-w-full truncate">{item.type || 'Thiết bị'}</span>
                                                {item.brand && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-bold max-w-full truncate">{item.brand}</span>}
                                            </div>
                                            <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 line-clamp-2 leading-tight mb-2" title={item.name}>{item.name}</h3>

                                            <div className="flex flex-wrap gap-1">
                                                {specs.power && <span className="bg-orange-50 px-1.5 py-0.5 rounded text-[10px] text-orange-700 border border-orange-100 font-medium whitespace-nowrap" title="Công suất">⚡ {specs.power}</span>}
                                                {specs.length && <span className="bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] text-emerald-700 border border-emerald-100 font-medium whitespace-nowrap" title="Độ dài">📏 {specs.length}</span>}
                                                {specs.capacity && <span className="bg-purple-50 px-1.5 py-0.5 rounded text-[10px] text-purple-700 border border-purple-100 font-medium whitespace-nowrap" title="Dung lượng">🔋 {specs.capacity}</span>}
                                            </div>
                                        </div>

                                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-2 pt-2 border-t border-gray-50 dark:border-gray-700">
                                            {item.status === 'Lent' && item.activeLending ? (() => {
                                                const urgency = item.activeLending.dueDate ? getUrgencyLevel(item.activeLending.dueDate) : 'none';
                                                const overdueStatus = item.activeLending.dueDate ? formatOverdueStatus(item.activeLending.dueDate) : '';
                                                return (
                                                    <div className="flex flex-col gap-0.5 w-full">
                                                        <div className="flex items-center gap-1 justify-between">
                                                            <span className="text-purple-600 dark:text-purple-400 font-medium">👤 {item.activeLending.borrowerName}</span>
                                                            {urgency === 'overdue' && (
                                                                <span className="bg-red-500 text-white px-1.5 py-0.5 rounded text-[9px] font-bold animate-pulse">
                                                                    QUÁ HẠN
                                                                </span>
                                                            )}
                                                        </div>
                                                        {item.activeLending.dueDate && (
                                                            <div className="flex items-center gap-1 text-[10px]">
                                                                <span className={`font-medium ${urgency === 'overdue' ? 'text-red-600 dark:text-red-400' :
                                                                    urgency === 'urgent' ? 'text-orange-600 dark:text-orange-400' :
                                                                        urgency === 'warning' ? 'text-amber-600 dark:text-amber-400' :
                                                                            'text-gray-500 dark:text-gray-400'
                                                                    }`}>
                                                                    📅 {overdueStatus}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })() : item.location ? (() => {
                                                const LocIcon = item.location.icon && LOCATION_ICONS[item.location.icon] ? LOCATION_ICONS[item.location.icon].icon : Database;
                                                const locColor = item.location.icon && LOCATION_ICONS[item.location.icon] ? LOCATION_ICONS[item.location.icon].color : "text-gray-400";
                                                return (
                                                    <><LocIcon className={`h-3 w-3 mr-1 shrink-0 ${locColor}`} /> <span className="truncate">{item.location.name}</span></>
                                                );
                                            })() : (
                                                <span className="italic text-gray-300">--</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Bulk Actions Floating Bar */}
            {selectedIds.size > 0 && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-primary-200 dark:border-gray-600 shadow-2xl rounded-full px-4 py-3 z-50 flex items-center gap-2 animate-in slide-in-from-bottom-10 fade-in duration-300 ring-4 ring-primary-50/50 dark:ring-gray-700/50 max-w-[95vw] overflow-x-auto">
                    <span className="font-bold text-gray-700 dark:text-gray-200 text-sm whitespace-nowrap mr-2 pl-1">{selectedIds.size} đã chọn</span>
                    <div className="h-6 w-px bg-gray-200 dark:bg-gray-600 mx-1"></div>

                    <Popover>
                        <PopoverTrigger asChild><Button size="sm" variant="ghost"><Wallet className="h-4 w-4 mr-2" /> Cho mượn</Button></PopoverTrigger>
                        <PopoverContent className="w-80 p-4 bg-white dark:bg-gray-800" side="top">
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                const fd = new FormData(e.currentTarget);
                                const name = fd.get('borrower') as string;
                                const dueDateStr = fd.get('dueDate') as string;
                                const dueDate = dueDateStr ? new Date(dueDateStr) : undefined;
                                if (name) {
                                    setIsLending(true);
                                    await bulkLendItems(Array.from(selectedIds), name, dueDate);
                                    setIsLending(false);
                                    toast("Đã cho mượn!", "success");
                                    setSelectedIds(new Set());
                                    router.refresh();
                                }
                            }} className="space-y-3">
                                <h4 className="font-bold text-sm">Cho mượn thiết bị</h4>
                                <div className="space-y-2">
                                    <Input name="borrower" placeholder="Tên người mượn..." required className="h-9" />
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-500">Ngày dự kiến trả (tùy chọn)</label>
                                        <Input name="dueDate" type="date" className="h-9" />
                                    </div>
                                </div>
                                <Button type="submit" size="sm" className="w-full bg-primary-600 text-white" disabled={isLending}>
                                    {isLending ? "Đang xử lý..." : "Xác nhận cho mượn"}
                                </Button>
                            </form>
                        </PopoverContent>
                    </Popover>

                    <Popover>
                        <PopoverTrigger asChild><Button size="sm" variant="ghost"><ArrowRightLeft className="h-4 w-4 mr-2" /> Chuyển kho</Button></PopoverTrigger>
                        <PopoverContent className="w-64 p-2 bg-white dark:bg-gray-800" side="top">
                            <div className="max-h-60 overflow-y-auto space-y-1">
                                {locations.map(loc => (
                                    <div key={loc.id} className="px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm dark:text-gray-200" onClick={() => handleBulkMove(loc.id)}>
                                        {loc.name}
                                    </div>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>

                    <div className="h-6 w-px bg-gray-200 dark:bg-gray-600 mx-1"></div>
                    <Button size="sm" variant="ghost" onClick={handleBulkDelete} className="text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4 mr-2" /> Xóa</Button>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedIds(new Set())}><X className="h-4 w-4" /></Button>
                </div>
            )}

            {/* Bag Mode Overlay */}
            {viewLocation && (
                <LocationDetailView location={viewLocation} allItems={initialItems} onClose={() => setViewLocation(null)} onUpdate={() => router.refresh()} />
            )}

            {/* QR Export Preview (Simplified structure) */}
            {isQrPreviewOpen && (
                <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col p-6">
                        <div className="flex justify-between mb-4">
                            <h3 className="font-bold text-xl dark:text-gray-100">Xuất QR Code</h3>
                            <Button variant="ghost" onClick={() => setIsQrPreviewOpen(false)}><X /></Button>
                        </div>
                        <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 p-8 flex flex-wrap gap-4 justify-center content-start">
                            <div id="qr-export-container" className="grid grid-cols-3 gap-8 bg-white dark:bg-gray-800 p-8">
                                {initialItems.filter(i => selectedIds.has(i.id)).map(item => (
                                    <div key={item.id} style={{ transform: 'scale(1)', width: '300px', height: '350px' }}>
                                        <QrCard item={item} simpleMode={true} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
