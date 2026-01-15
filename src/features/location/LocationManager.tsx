"use client";

import { useState, useEffect } from "react";
import { Folder, Box, Plus, User, Trash2, ChevronRight, ChevronDown, MapPin, Package, RefreshCw } from "lucide-react";
import { createLocation, deleteLocation, getLocationItems } from "@/features/location/actions";
import { Button, Input, Select, Label, Card, CardHeader, CardTitle, CardContent } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { ItemDetailDialog } from "@/features/inventory/ItemDetailDialog";
import { getItem } from "@/app/actions";
import { LocationDetailView } from "@/features/locations/LocationDetailView";

interface LocationNode {
    id: string;
    name: string;
    type: string;
    children: LocationNode[];
    _count?: { items: number };
}

export function LocationManager({ initialLocations }: { initialLocations: LocationNode[] }) {
    const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<LocationNode | null>(null);
    const [locationItems, setLocationItems] = useState<any[]>([]);
    const [isLoadingItems, setIsLoadingItems] = useState(false);

    // Item Detail State
    const [detailItem, setDetailItem] = useState<any>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    // Manage Location Inventory (Dual View)
    const [isManageOpen, setIsManageOpen] = useState(false);
    const [allItems, setAllItems] = useState<any[]>([]);

    useEffect(() => {
        if (isManageOpen) {
            import("@/app/actions").then(mod => {
                // @ts-ignore
                if (mod.getItems) mod.getItems().then(setAllItems);
                // Wait, we don't have getItems exposed generally maybe? 
                // Actually `getLocationItems` is specific. 
                // We might need a `getAllItems` for the dual list left side.
                // Let's assume `getLocationItems(null)` or similar gets all? 
                // Actually `ItemDetailDialog` is passed `initialItems` in InventoryManager. 
                // Here we are in `LocationManager` which doesn't have all items by default.
                // We should add `getAllItems` to location actions or `app/actions`.
            });
        }
    }, [isManageOpen]);

    const [isCreating, setIsCreating] = useState(false);
    const [newLocName, setNewLocName] = useState("");
    const [newLocType, setNewLocType] = useState("Fixed");
    const { toast } = useToast();
    const router = useRouter();

    // Find selected node in tree to get details
    const findNode = (id: string, nodes: LocationNode[]): LocationNode | null => {
        for (const node of nodes) {
            if (node.id === id) return node;
            if (node.children) {
                const found = findNode(id, node.children);
                if (found) return found;
            }
        }
        return null;
    };

    useEffect(() => {
        if (selectedLocationId) {
            const node = findNode(selectedLocationId, initialLocations);
            setSelectedLocation(node);

            // Fetch items
            setIsLoadingItems(true);
            getLocationItems(selectedLocationId).then(items => {
                setLocationItems(items);
                setIsLoadingItems(false);
            });
        } else {
            setSelectedLocation(null);
            setLocationItems([]);
        }
    }, [selectedLocationId, initialLocations]);

    const handleCreate = async () => {
        if (!newLocName) return;
        const res = await createLocation({
            name: newLocName,
            type: newLocType,
            parentId: selectedLocationId
        });

        if (res.success) {
            toast("Đã tạo vị trí mới thành công", "success");
            setNewLocName("");
            if (!selectedLocationId) setIsCreating(false);
            router.refresh();
        } else {
            toast("Lỗi khi tạo vị trí", "error");
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Bạn có chắc muốn xóa vị trí này? Cần xóa hết đồ con trước.")) {
            const res = await deleteLocation(id);
            if (res.success) {
                toast("Đã xóa vị trí", "success");
                if (selectedLocationId === id) setSelectedLocationId(null);
                router.refresh();
            } else {
                toast(res.error || "Lỗi xóa", "error");
            }
        }
    };

    // New: Handle click item
    const handleItemClick = async (itemId: string) => {
        // Need to fetch full item details first? Or rely on what's in list?
        // ItemDetailDialog expects full item with history.
        // Let's fetch it.
        const fullItem = await getItem(itemId);
        if (fullItem) {
            setDetailItem(fullItem);
            setIsDetailOpen(true);
        }
    };

    // Recursively flatten locations for dropdown (if needed) - reusing ItemDetail logic
    // Just pass simple list for now, or re-fetch in dialog
    // Actually ItemDetailDialog expects `locations` array.
    // We can construct a flat list from `initialLocations`
    const flattenLocations = (nodes: LocationNode[]): any[] => {
        let list: any[] = [];
        for (const node of nodes) {
            list.push({ id: node.id, name: node.name, type: node.type });
            if (node.children) list = list.concat(flattenLocations(node.children));
        }
        return list;
    };
    const flatLocations = flattenLocations(initialLocations);


    const LocationTreeItem = ({ node, level = 0 }: { node: LocationNode, level?: number }) => {
        const [isExpanded, setIsExpanded] = useState(true);
        const hasChildren = node.children && node.children.length > 0;
        const isSelected = selectedLocationId === node.id;

        return (
            <div className="select-none">
                <div
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-primary-100 text-primary-900 font-bold' : 'hover:bg-primary-50/50 text-gray-700'}`}
                    style={{ marginLeft: `${level * 16}px` }}
                    onClick={() => {
                        setSelectedLocationId(node.id);
                        setIsCreating(false);
                    }}
                >
                    <button onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded) }} className="p-0.5 hover:bg-black/5 rounded text-gray-400">
                        {hasChildren ? (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <span className="w-3.5" />}
                    </button>

                    {node.type === 'Person' ? <User size={16} className="text-purple-500" /> :
                        node.type === 'Container' ? <Box size={16} className="text-primary-500" /> :
                            <Folder size={16} className="text-amber-500" />}

                    <span className="text-sm flex-1 truncate">{node.name}</span>

                    {/* Item Count Badge */}
                    {node._count && node._count.items > 0 && (
                        <span className="bg-primary-200 text-primary-800 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                            {node._count.items}
                        </span>
                    )}
                </div>
                {isExpanded && hasChildren && (
                    <div className="border-l border-primary-100 ml-[11px]">
                        {node.children.map(child => <LocationTreeItem key={child.id} node={child} level={level + 1} />)}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[700px]">
            <ItemDetailDialog
                item={detailItem}
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                locations={flatLocations}
            />

            {isManageOpen && selectedLocation && (
                <LocationDetailView
                    location={selectedLocation}
                    allItems={allItems}
                    onClose={() => setIsManageOpen(false)}
                    onUpdate={async () => {
                        // Refresh current list - AND the global list to update "Available" side
                        if (selectedLocationId) {
                            getLocationItems(selectedLocationId).then(setLocationItems);
                        }
                        const { getAllItems } = await import("@/app/actions");
                        const items = await getAllItems();
                        setAllItems(items);
                    }}
                />
            )}

            {/* Tree View */}
            <Card className="md:col-span-1 border-primary-100 shadow-sm flex flex-col h-full bg-white">
                <CardHeader className="pb-2 border-b border-primary-50 bg-primary-50/30">
                    <CardTitle className="text-base text-primary-700 flex justify-between items-center">
                        <span>Danh sách vị trí</span>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => router.refresh()}> <RefreshCw size={14} /> </Button>
                            <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => { setSelectedLocationId(null); setIsCreating(true); }}>
                                <Plus size={16} />
                            </Button>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto pt-2 pl-2">
                    {initialLocations.map(node => <LocationTreeItem key={node.id} node={node} />)}
                    {initialLocations.length === 0 && <p className="text-sm text-gray-400 text-center py-10">Chưa có vị trí nào</p>}
                </CardContent>
            </Card>

            {/* Details & Actions Panel */}
            <Card className="md:col-span-2 border-primary-100 shadow-sm overflow-hidden flex flex-col bg-white">
                {!selectedLocationId && !isCreating ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
                        <MapPin className="h-16 w-16 mb-4 opacity-20 text-primary-500" />
                        <p>Chọn vị trí để xem kho</p>
                    </div>
                ) : isCreating ? (
                    <div className="p-8 max-w-lg mx-auto w-full">
                        <h3 className="font-bold text-lg text-primary-800 mb-6 flex items-center gap-2">
                            <Plus className="h-5 w-5" />
                            {selectedLocationId ? "Thêm vị trí con" : "Tạo vị trí gốc mới"}
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <Label>Tên vị trí</Label>
                                <Input value={newLocName} onChange={e => setNewLocName(e.target.value)} placeholder="Tên phòng, Tủ, Balo..." className="border-primary-200" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Loại</Label>
                                    <Select value={newLocType} onChange={e => setNewLocType(e.target.value)} className="border-primary-200">
                                        <option value="Fixed">Cố định (Phòng/Nhà)</option>
                                        <option value="Container">Túi/Hộp (Di động)</option>
                                        <option value="Person">Người (Cho mượn)</option>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Vị trí cha</Label>
                                    <div className="text-sm p-2 bg-gray-100 rounded-md truncate h-10 flex items-center">
                                        {selectedLocationId ? (selectedLocation?.name || "Đang chọn...") : "Gốc (Root)"}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2 pt-4">
                                <Button onClick={handleCreate} className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-bold shadow-lg shadow-primary-500/20">Lưu vị trí</Button>
                                <Button onClick={() => setIsCreating(false)} variant="outline" className="flex-1 border-primary-200 text-primary-600 hover:bg-primary-50">Hủy</Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col h-full">
                        {/* Detail Header */}
                        <div className="px-6 py-4 border-b border-primary-100 bg-primary-50/30 flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                    {selectedLocation?.type === 'Person' ? <User className="text-purple-500" /> : selectedLocation?.type === 'Container' ? <Box className="text-primary-500" /> : <Folder className="text-amber-500" />}
                                    {selectedLocation?.name}
                                </h2>
                                <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                                    <span className="bg-white border border-gray-200 px-2 py-0.5 rounded text-xs">{selectedLocation?.type}</span>
                                    <span>•</span>
                                    <span>ID: {selectedLocation?.id.slice(0, 8)}</span>
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" onClick={async () => {
                                    // Fetch all items on open
                                    const { getAllItems } = await import("@/app/actions");
                                    // We need to implement getAllItems if not exists
                                    // For now let's try to find where to fetch.
                                    // Quick fix: fetch directly via server action wrapper
                                    const items = await getAllItems();
                                    setAllItems(items);
                                    setIsManageOpen(true);
                                }} className="bg-primary-500 text-white hover:bg-primary-600 gap-1 shadow-sm">
                                    <Package size={14} /> Quản lý túi đồ
                                </Button>
                                <Button size="sm" onClick={() => setIsCreating(true)} className="bg-white border border-primary-200 text-primary-700 hover:bg-primary-50 gap-1">
                                    <Plus size={14} /> Thêm con
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleDelete(selectedLocationId!)} className="text-red-400 hover:text-red-600 hover:bg-red-50">
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                        </div>

                        {/* Items List */}
                        <div className="flex-1 overflow-auto bg-slate-50 p-6">
                            <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 flex justify-between">
                                <span>📦 Thiết bị tại đây ({locationItems.length})</span>
                            </h3>

                            {isLoadingItems ? (
                                <div className="text-center py-10 text-gray-400 animate-pulse">Đang tải danh sách...</div>
                            ) : locationItems.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {locationItems.map(item => (
                                        <div
                                            key={item.id}
                                            className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow cursor-pointer hover:border-primary-300"
                                            onClick={() => handleItemClick(item.id)}
                                        >
                                            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-gray-400 text-xs overflow-hidden">
                                                {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : item.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-sm truncate" title={item.name}>{item.name}</div>
                                                <div className="text-xs text-gray-500 truncate">{item.brand || "No Brand"} • {item.model || ""}</div>
                                            </div>
                                            <div className={`w-2 h-2 rounded-full ${item.status === 'Available' ? 'bg-green-500' : 'bg-primary-500'}`} />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl bg-white/50">
                                    <Package className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                                    <p className="text-gray-400 text-sm">Chưa có thiết bị nào trực tiếp ở đây.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
