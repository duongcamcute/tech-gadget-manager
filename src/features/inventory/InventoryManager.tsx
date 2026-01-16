"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { QrCode, Package, Database, Search, LayoutDashboard, Tag, Wallet, Check, X } from "lucide-react";
import { ItemActions } from "./ItemActions";
import { Card, Button, Input, Select } from "@/components/ui/primitives";
import { ItemDetailDialog } from "./ItemDetailDialog";
import { LocationDetailView } from "@/features/locations/LocationDetailView";
import { useRouter } from "next/navigation";

import { ITEM_ICONS, ITEM_STATUS } from "@/lib/constants/options";
import { getColorHex } from "@/lib/utils/colors";
import html2canvas from "html2canvas";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { QrCard } from "@/components/printing/QrCard";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { bulkMoveItems, bulkDeleteItems } from "@/app/actions";
import { bulkLendItems } from "@/features/lending/actions";
import { Trash2, ArrowRightLeft } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { Checkbox } from "@/components/ui/Checkbox";

function getItemIconData(type: string) {
    return ITEM_ICONS[type] || ITEM_ICONS['default'];
}

function getStatusBadge(status: string) {
    // @ts-ignore
    const config = ITEM_STATUS[status] || ITEM_STATUS['Available'];
    return (
        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${config.color}`}>
            {config.label}
        </span>
    );
}

export default function InventoryManager({ initialItems, locations }: { initialItems: any[], locations: any[] }) {
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All"); // New Filter
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [viewLocation, setViewLocation] = useState<any>(null); // For Bag Mode
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isExporting, setIsExporting] = useState(false);
    const [isMoving, setIsMoving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isLending, setIsLending] = useState(false);
    const [isQrPreviewOpen, setIsQrPreviewOpen] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    const toggleSelection = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const toggleAll = () => {
        if (selectedIds.size === filteredItems.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredItems.map(i => i.id)));
        }
    };

    // Manual Canvas Drawing to bypass html2canvas issues completely
    const generateQrImage = (item: any): Promise<Blob | null> => {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(null);

            // Set dimensions (300x350) scale x2 for better quality
            const width = 300 * 2;
            const height = 350 * 2;
            canvas.width = width;
            canvas.height = height;
            ctx.scale(2, 2);

            // Background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, 300, 350);

            // Border (Thinner and closer to edge)
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(2, 2, 296, 346);
            ctx.setLineDash([]);

            // Fonts - Compact Text to save space for QR
            ctx.font = 'bold 20px Arial'; // Slightly smaller title
            ctx.fillStyle = '#000000';
            ctx.textAlign = 'center';

            // Title (Name)
            const name = item.name.length > 25 ? item.name.substring(0, 25) + '...' : item.name;
            ctx.fillText(name, 150, 35); // Higher up

            // Subtitle (Type • Category)
            ctx.font = 'bold 11px Arial';
            ctx.fillStyle = '#555555';
            ctx.fillText(`${item.type} • ${item.category}`.toUpperCase(), 150, 55);

            // QR Code Placeholder Area
            // MAXIMIZED SIZE: 220px (was 160px)
            const qrSize = 220;
            const qrY = 75;

            // We need to fetch the actual QR SVG or render it. 
            const previewCard = document.getElementById(`qr-card-${item.id}`);
            if (previewCard) {
                const svg = previewCard.querySelector('svg');
                if (svg) {
                    const xml = new XMLSerializer().serializeToString(svg);
                    const svg64 = btoa(xml);
                    const b64Start = 'data:image/svg+xml;base64,';
                    const image64 = b64Start + svg64;

                    const img = new Image();
                    img.onload = () => {
                        // Draw QR centered and large
                        ctx.drawImage(img, (300 - qrSize) / 2, qrY, qrSize, qrSize);

                        // ID Badge - Footer
                        ctx.fillStyle = '#f0f0f0';
                        ctx.fillRect(80, 310, 140, 24); // Wider background
                        ctx.font = 'bold 14px Monospace'; // Larger ID
                        ctx.fillStyle = '#000000';
                        ctx.fillText('#' + item.id.slice(0, 8).toUpperCase(), 150, 327);

                        canvas.toBlob(resolve, 'image/png');
                    };
                    img.src = image64;
                    return;
                }
            }
            resolve(null);
        });
    };


    const handleExportQR = async () => {
        if (!isQrPreviewOpen) {
            setIsQrPreviewOpen(true);
            return;
        }

        setIsExporting(true);
        try {
            const zip = new JSZip();
            const itemsToExport = initialItems.filter(i => selectedIds.has(i.id));

            for (const item of itemsToExport) {
                const blob = await generateQrImage(item);
                if (blob) {
                    zip.file(`qr-${item.id.slice(0, 8)}.png`, blob);
                }
            }

            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, `qr-codes-${new Date().toISOString().slice(0, 10)}.zip`);

            toast("Xuất thành công!", "success");
            setIsQrPreviewOpen(false);
        } catch (error) {
            console.error(error);
            toast("Lỗi xuất ảnh", "error");
        } finally {
            setIsExporting(false);
        }
    };

    const handleBulkMove = async (locationId: string) => {
        if (selectedIds.size === 0) return;
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

    const filteredItems = useMemo(() => {
        return initialItems.filter(item => {
            const term = search.toLowerCase();
            const matchesSearch = item.name.toLowerCase().includes(term) ||
                item.specs?.includes(term) ||
                item.brand?.toLowerCase().includes(term) ||
                item.color?.toLowerCase().includes(term) ||
                item.location?.name.toLowerCase().includes(term);
            const matchesType = typeFilter === "All" || item.type === typeFilter;
            const matchesStatus = statusFilter === "All" || item.status === statusFilter;
            return matchesSearch && matchesType && matchesStatus;
        });
    }, [initialItems, search, typeFilter, statusFilter]);

    // Dashboard Stats
    const stats = useMemo(() => {
        return {
            total: initialItems.length,
            value: initialItems.reduce((acc, item) => acc + (item.purchasePrice || 0), 0),
            lending: initialItems.filter(i => i.status === 'Lent').length,
            available: initialItems.filter(i => i.status === 'Available').length
        };
    }, [initialItems]);

    return (
        <div className="space-y-8">
            <ItemDetailDialog
                item={selectedItem}
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
                locations={locations}
            />

            {/* Dashboard Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 select-none">
                <div onClick={() => setStatusFilter("All")} className={`cursor-pointer bg-gradient-to-br from-primary-500 to-primary-600 p-5 rounded-2xl text-white shadow-lg shadow-primary-500/20 transition-all active:scale-95 ${statusFilter === 'All' ? 'ring-2 ring-offset-2 ring-primary-500' : 'opacity-90 hover:opacity-100'}`}>
                    <div className="flex items-center gap-2 opacity-80 mb-1"><LayoutDashboard className="h-4 w-4" /> Tổng giá trị</div>
                    <div className="text-3xl font-bold tracking-tight">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(stats.value)}</div>
                    <div className="text-[10px] opacity-70 mt-1 font-medium">{stats.total} thiết bị</div>
                </div>
                <div onClick={() => setStatusFilter("Available")} className={`cursor-pointer bg-white p-5 rounded-2xl border border-blue-100 shadow-sm transition-all active:scale-95 ${statusFilter === 'Available' ? 'ring-2 ring-offset-2 ring-blue-500 bg-blue-50' : 'hover:border-blue-300'}`}>
                    <div className="flex items-center gap-2 text-blue-600 mb-1 font-medium"><Package className="h-4 w-4" /> Sẵn sàng</div>
                    <div className="text-2xl font-bold text-gray-800">{stats.available}</div>
                </div>
                <div onClick={() => setStatusFilter("Lent")} className={`cursor-pointer bg-white p-5 rounded-2xl border border-purple-100 shadow-sm transition-all active:scale-95 ${statusFilter === 'Lent' ? 'ring-2 ring-offset-2 ring-purple-500 bg-purple-50' : 'hover:border-purple-300'}`}>
                    <div className="flex items-center gap-2 text-purple-600 mb-1 font-medium"><Wallet className="h-4 w-4" /> Đang cho mượn</div>
                    <div className="text-2xl font-bold text-gray-800">{stats.lending}</div>
                </div>
                <div className="cursor-default bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 text-gray-500 mb-1 font-medium"><Tag className="h-4 w-4" /> Hãng/Brand</div>
                    <div className="text-2xl font-bold text-gray-800">{new Set(initialItems.map(i => i.brand).filter(Boolean)).size}</div>
                </div>
            </div>

            {/* Search Bar - Sticky only on Desktop */}
            <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-primary-100 shadow-sm md:sticky md:top-[80px] z-10">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-primary-300" />
                    <Input
                        placeholder="Tìm kiếm tên, màu sắc, hãng, vị trí..."
                        className="pl-10 h-10 border-primary-200 focus:border-primary-500 bg-primary-50/50 text-base"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-56">
                    <Select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="h-10 border-primary-200 focus:border-primary-500 bg-primary-50/50"
                    >
                        <option value="All">Tất cả danh mục</option>
                        <option value="Cable">Dây cáp</option>
                        <option value="Charger">Củ sạc</option>
                        <option value="Storage">Lưu trữ</option>
                        <option value="Audio">Âm thanh</option>
                        <option value="Others">Khác</option>
                    </Select>
                </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between px-2 pt-2 gap-4">
                <h2 className="text-lg font-bold text-gray-900 border-l-4 border-primary-500 pl-3">Danh sách chi tiết</h2>
                <div className="flex flex-wrap gap-2 items-center justify-between md:justify-end w-full md:w-auto">
                    <div className="hidden md:block h-8 w-px bg-gray-300 mx-2"></div>
                    <select
                        className="h-8 text-xs border border-gray-300 rounded-md bg-white px-2 py-0 focus:ring-2 focus:ring-primary-500 outline-none max-w-full"
                        onChange={(e) => {
                            if (e.target.value) {
                                const loc = locations.find(l => l.id === e.target.value);
                                setViewLocation(loc);
                                e.target.value = ""; // Reset
                            }
                        }}
                    >
                        <option value="">⚙ Quản lý túi đồ...</option>
                        {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>

                    <Button variant="outline" size="sm" onClick={toggleAll} className="h-7 text-xs border-dashed border-gray-300 text-gray-500 bg-white hover:border-primary-300 hover:text-primary-600">
                        {selectedIds.size === filteredItems.length && filteredItems.length > 0 ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                    </Button>
                    {statusFilter !== 'All' && <span onClick={() => setStatusFilter("All")} className="cursor-pointer text-xs font-bold text-white bg-gray-500 px-2 py-1 rounded-full hover:bg-gray-600">Xóa lọc: {statusFilter}</span>}
                    <span className="text-xs font-medium text-primary-600 bg-primary-50 px-3 py-1.5 rounded-full border border-primary-100">
                        {filteredItems.length} kết quả
                    </span>
                </div>
            </div>

            {/* Grid List */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredItems.map((item) => {
                    const { icon: Icon, color, bg } = getItemIconData(item.type);
                    const specs = (() => {
                        try {
                            return item.specs ? JSON.parse(item.specs as string) : {};
                        } catch (e) {
                            return {};
                        }
                    })();
                    const isSelected = selectedIds.has(item.id);

                    return (
                        <Card key={item.id} className={`group relative flex h-full bg-white border-primary-100/60 shadow-sm hover:shadow-xl hover:shadow-primary-100/50 hover:border-primary-300 transition-all duration-300 hover:-translate-y-1 rounded-2xl ${isSelected ? 'ring-2 ring-primary-500 ring-offset-2 border-primary-500' : ''}`}>

                            <div className="flex flex-row h-full">
                                {/* Selection Checkbox - Outside/Absolute */}
                                <div className={`absolute top-2 left-2 z-20 ${selectedIds.size > 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                    <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={() => toggleSelection(item.id)}
                                        className="shadow-sm border-gray-400 data-[state=checked]:border-primary-600"
                                    />
                                </div>

                                {/* Compact Image / Icon Area */}
                                <div className="w-24 shrink-0 border-r border-gray-100 bg-gray-50 flex items-center justify-center relative cursor-pointer" onClick={() => setSelectedItem(item)}>
                                    {item.image ? (
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className={`${bg} ${color} p-3 rounded-xl`}>
                                            <Icon className="h-8 w-8 opacity-70" />
                                        </div>
                                    )}
                                </div>

                                {/* Content Area */}
                                <div className="p-3 flex-1 flex flex-col justify-between min-w-0" onClick={() => setSelectedItem(item)}>
                                    <div>
                                        <div className="flex justify-between items-start gap-2">
                                            <h3 className="font-bold text-sm text-gray-900 line-clamp-2 leading-tight mb-1" title={item.name}>{item.name}</h3>
                                            <Link href={`/items/${item.id}/qr`} className="text-gray-300 hover:text-primary-600 p-1" title="QR">
                                                <QrCode className="h-3.5 w-3.5" />
                                            </Link>
                                        </div>
                                        <div className="flex flex-wrap gap-1 mb-2">
                                            <span className="text-[10px] items-center px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">{item.category}</span>
                                            {item.brand && <span className="text-[10px] items-center px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">{item.brand}</span>}
                                        </div>

                                        {/* Specs Row - Restored */}
                                        <div className="flex flex-wrap gap-1 mb-2">
                                            {specs.power && <span className="bg-orange-50 px-1.5 py-0.5 rounded text-[10px] font-medium text-orange-700 border border-orange-100" title="Công suất">⚡ {specs.power}</span>}
                                            {specs.length && <span className="bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] font-medium text-emerald-700 border border-emerald-100" title="Độ dài">📏 {specs.length}</span>}
                                            {specs.capacity && <span className="bg-purple-50 px-1.5 py-0.5 rounded text-[10px] font-medium text-purple-700 border border-purple-100" title="Dung lượng">🔋 {specs.capacity}</span>}
                                            {item.color && (
                                                <span className="bg-gray-50 px-1.5 py-0.5 rounded text-[10px] font-medium text-gray-700 border flex items-center gap-1" title="Màu sắc">
                                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getColorHex(item.color) }}></div>
                                                    {item.color}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-1 pt-2 border-t border-gray-50">
                                        {getStatusBadge(item.status)}
                                        {item.location && (
                                            <span className="flex items-center text-xs text-gray-500 max-w-[50%]" title={item.location.name}>
                                                <Database className="h-3 w-3 mr-1 shrink-0" /> <span className="truncate">{item.location.name}</span>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )
                })}
            </div>

            {/* Floating Action Bar */}
            {selectedIds.size > 0 && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-md border border-primary-200 shadow-2xl rounded-2xl md:rounded-full px-4 py-3 z-50 flex items-center gap-2 animate-in slide-in-from-bottom-10 fade-in duration-300 ring-4 ring-primary-50/50 max-w-[95vw] overflow-x-auto no-scrollbar">
                    <span className="font-bold text-gray-700 text-sm whitespace-nowrap mr-2 pl-1">{selectedIds.size} đã chọn</span>

                    <div className="h-6 w-px bg-gray-200 mx-1"></div>

                    {/* Bulk Lend Popover */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-gray-600 hover:text-primary-600 hover:bg-primary-50 transition-colors h-8 px-3" disabled={isLending}>
                                <Wallet className="h-4 w-4 mr-2" /> Cho mượn
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 p-4 rounded-xl shadow-xl border-primary-100 mb-4 bg-white" side="top" align="center">
                            <form
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.currentTarget);
                                    const name = formData.get("borrower") as string;
                                    const date = formData.get("date") as string;

                                    if (!name) return;

                                    setIsLending(true);
                                    const res = await bulkLendItems(Array.from(selectedIds), name, date ? new Date(date) : undefined);
                                    setIsLending(false);

                                    if (res.success) {
                                        toast(`Đã cho ${name} mượn ${selectedIds.size} món`, "success");
                                        setSelectedIds(new Set());
                                        router.refresh();
                                    } else {
                                        toast("Lỗi: " + res.error, "error");
                                    }
                                }}
                                className="space-y-3"
                            >
                                <div className="space-y-1">
                                    <h4 className="font-bold text-sm text-gray-700">Cho mượn {selectedIds.size} thiết bị</h4>
                                    <p className="text-xs text-gray-500">Nhập tên người mượn để lưu lịch sử</p>
                                </div>
                                <Input name="borrower" placeholder="Tên người mượn..." required className="h-8 text-sm" />
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Hạn trả (Tùy chọn)</label>
                                    <Input name="date" type="date" className="h-8 text-sm" />
                                </div>
                                <Button type="submit" className="w-full h-8 text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white">
                                    Xác nhận
                                </Button>
                            </form>
                        </PopoverContent>
                    </Popover>

                    {/* Bulk Move Popover */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors h-8 px-3" disabled={isMoving}>
                                {isMoving ? <span className="animate-spin mr-2">⏳</span> : <ArrowRightLeft className="h-4 w-4 mr-2" />}
                                Chuyển kho
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-2 rounded-xl shadow-xl border-primary-100 mb-4 bg-white" side="top" align="center">
                            <div className="text-sm font-bold text-gray-500 px-2 py-1 mb-1 uppercase tracking-wider">Chọn vị trí đến</div>
                            <div className="max-h-60 overflow-y-auto space-y-1">
                                {locations.map(loc => (
                                    <div
                                        key={loc.id}
                                        className="px-3 py-2 rounded-lg hover:bg-primary-50 cursor-pointer text-sm text-gray-700 flex items-center gap-2 transition-colors"
                                        onClick={() => handleBulkMove(loc.id)}
                                    >
                                        <Database className="h-3.5 w-3.5 text-primary-400" />
                                        {loc.name}
                                    </div>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>

                    <Button size="sm" variant="ghost" className="text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-colors h-8 px-3" onClick={() => setIsQrPreviewOpen(true)} disabled={isExporting}>
                        <QrCode className="h-4 w-4 mr-2" /> Xuất QR
                    </Button>

                    <div className="h-6 w-px bg-gray-200 mx-1"></div>

                    <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors h-8 px-3" onClick={handleBulkDelete} disabled={isDeleting}>
                        {isDeleting ? <span className="animate-spin mr-2">⏳</span> : <Trash2 className="h-4 w-4 mr-2" />}
                        Xóa
                    </Button>

                    <Button size="sm" variant="ghost" className="text-gray-400 hover:text-gray-600 ml-1 h-8 w-8 p-0 rounded-full" onClick={() => setSelectedIds(new Set())} title="Bỏ chọn">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {/* QR Preview Modal - Visible Rendering Strategy */}
            {isQrPreviewOpen && (
                <div className="fixed inset-0 z-[100] bg-black/80 flex flex-col items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-4xl h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Xem trước & Xuất {selectedIds.size} mã QR</h3>
                            <Button variant="ghost" onClick={() => setIsQrPreviewOpen(false)}><X /></Button>
                        </div>

                        <div className="flex-1 overflow-auto bg-gray-100 p-4 rounded-xl border border-gray-200 mb-4">
                            {/* This container is the one we capture */}
                            {/* WE MUST NOT USE TAILWIND CLASSES HERE to avoid 'unsupported color function' error in html2canvas */}
                            <div
                                id="qr-export-container"
                                style={{
                                    backgroundColor: '#ffffff',
                                    padding: '32px',
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                    gap: '16px',
                                    width: 'fit-content',
                                    margin: '0 auto'
                                }}
                            >
                                {initialItems.filter(i => selectedIds.has(i.id)).map(item => (
                                    <div key={item.id} style={{ transform: 'scale(0.75)', transformOrigin: 'top left', width: '300px', height: '350px', backgroundColor: '#ffffff' }}>
                                        <QrCard item={item} simpleMode={true} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button onClick={() => setIsQrPreviewOpen(false)} variant="outline">Hủy</Button>
                            <Button onClick={handleExportQR} disabled={isExporting} className="bg-primary-600 text-white hover:bg-primary-700">
                                {isExporting ? "Đang xử lý..." : "Tải xuống ngay"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}


            {/* Bag Mode View */}
            {viewLocation && (
                <LocationDetailView
                    location={viewLocation}
                    allItems={initialItems}
                    onClose={() => setViewLocation(null)}
                    onUpdate={() => router.refresh()}
                />
            )}
        </div>
    );
}
