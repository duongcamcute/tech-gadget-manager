"use client";

import { useState, useMemo } from "react";
import { Button, Input } from "@/components/ui/primitives"; // Check if dialog exists, if not use custom overlay
import { Search, MapPin, ArrowRight, ArrowLeft, Package, Plus, Trash2 } from "lucide-react";
import { updateItem, bulkMoveItems } from "@/app/actions";
import { cn } from "@/lib/utils";
import { ITEM_ICONS } from "@/lib/constants/options";

// Assuming we pass all items and current location
export function LocationDetailView({ location, allItems, onClose, onUpdate }: { location: any, allItems: any[], onClose: () => void, onUpdate: () => void }) {
    const [searchLeft, setSearchLeft] = useState("");
    const [searchRight, setSearchRight] = useState("");

    // Left: Available Items (Not in this location)
    // Right: Items in this location
    const leftItems = useMemo(() => {
        return allItems.filter(i =>
            i.locationId !== location.id &&
            (i.name.toLowerCase().includes(searchLeft.toLowerCase()) || i.type.toLowerCase().includes(searchLeft.toLowerCase()))
        );
    }, [allItems, location.id, searchLeft]);

    const rightItems = useMemo(() => {
        return allItems.filter(i =>
            i.locationId === location.id &&
            (i.name.toLowerCase().includes(searchRight.toLowerCase()) || i.type.toLowerCase().includes(searchRight.toLowerCase()))
        );
    }, [allItems, location.id, searchRight]);

    const [optimisticLeft, setOptimisticLeft] = useState<any[]>([]);
    const [optimisticRight, setOptimisticRight] = useState<any[]>([]);

    // Sync optimistic state with props when they change (initial load or server revalidation)
    useMemo(() => {
        setOptimisticLeft(leftItems);
    }, [leftItems]);

    useMemo(() => {
        setOptimisticRight(rightItems);
    }, [rightItems]);

    const handleMove = async (item: any, targetLocationId: string | null) => {
        // Optimistic Update
        if (targetLocationId === location.id) {
            // Moving IN (Left -> Right)
            setOptimisticLeft(prev => prev.filter(i => i.id !== item.id));
            setOptimisticRight(prev => [...prev, { ...item, locationId: location.id }]);
        } else {
            // Moving OUT (Right -> Left)
            setOptimisticRight(prev => prev.filter(i => i.id !== item.id));
            setOptimisticLeft(prev => [...prev, { ...item, locationId: null }]); // Assuming null makes it available
        }

        // Server Mutation - Use bulkMoveItems for simpler update without full validation requirements
        await bulkMoveItems([item.id], targetLocationId);
        // We trigger onUpdate to sync perfectly eventually, but optimistic makes it feel instant
        onUpdate();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="relative w-full max-w-5xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-primary-50/50 dark:bg-gray-900/50">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                            <MapPin className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Quản lý túi đồ: {location.name}</h2>
                            <p className="text-xs text-gray-500">{optimisticRight.length} thiết bị bên trong</p>
                        </div>
                    </div>
                    <Button variant="ghost" onClick={onClose} className="rounded-full h-8 w-8 p-0 hover:bg-gray-200">✕</Button>
                </div>

                {/* Dual List Body */}
                <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-700">

                    {/* LEFT: Outside / Available */}
                    <div className="flex flex-col h-full bg-gray-50/50 dark:bg-gray-900/50">
                        <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    className="pl-9 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                                    placeholder="Tìm thiết bị bên ngoài..."
                                    value={searchLeft}
                                    onChange={(e) => setSearchLeft(e.target.value)}
                                />
                            </div>
                            <div className="mt-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Kho thiết bị ({optimisticLeft.length})
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {optimisticLeft.map(item => {
                                const { icon: ItemIcon, color, bg } = ITEM_ICONS[item.category] || ITEM_ICONS[item.type] || ITEM_ICONS['default'];
                                return (
                                    <div key={item.id} className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 flex items-center gap-3 hover:border-primary-300 dark:hover:border-primary-500 hover:shadow-sm transition-all shadow-sm">
                                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden ${item.image ? 'bg-gray-100' : bg}`}>
                                            {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <ItemIcon className={`h-4 w-4 ${color}`} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{item.name}</p>
                                            <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                                                <span className="truncate max-w-[80px]">{item.type}</span>
                                                {item.location && <span className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-gray-600 dark:text-gray-300 truncate max-w-[100px]">{item.location.name}</span>}
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            className="h-8 w-8 p-0 rounded-full bg-primary-50 text-primary-600 hover:bg-primary-600 hover:text-white"
                                            onClick={() => handleMove(item, location.id)}
                                            title="Chuyển vào túi này"
                                        >
                                            <div className="hidden md:block"><ArrowRight className="h-4 w-4" /></div>
                                            <div className="md:hidden"><Plus className="h-4 w-4" /></div>
                                        </Button>
                                    </div>
                                );
                            })}
                            {optimisticLeft.length === 0 && <div className="text-center py-10 text-sm text-gray-400">Không tìm thấy thiết bị nào</div>}
                        </div>
                    </div>

                    {/* RIGHT: Inside this Location */}
                    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
                        <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-primary-50/30 dark:bg-primary-900/20">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-primary-400" />
                                <Input
                                    className="pl-9 bg-white dark:bg-gray-800 border-primary-100 dark:border-gray-600 focus:border-primary-300"
                                    placeholder="Tìm trong túi..."
                                    value={searchRight}
                                    onChange={(e) => setSearchRight(e.target.value)}
                                />
                            </div>
                            <div className="mt-2 text-xs font-bold text-primary-700 uppercase tracking-wider">
                                Đang có trong túi ({optimisticRight.length})
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {optimisticRight.map(item => {
                                const { icon: ItemIcon, color, bg } = ITEM_ICONS[item.category] || ITEM_ICONS[item.type] || ITEM_ICONS['default'];
                                return (
                                    <div key={item.id} className="group bg-white dark:bg-gray-800 border border-primary-100 dark:border-gray-600 rounded-xl p-3 flex items-center gap-3 hover:border-red-200 dark:hover:border-red-800 transition-colors shadow-sm">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 w-8 p-0 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50"
                                            onClick={() => handleMove(item, null)} // Or move back to "Storage"
                                            title="Bỏ ra khỏi túi"
                                        >
                                            <div className="hidden md:block"><ArrowLeft className="h-4 w-4" /></div>
                                            <div className="md:hidden"><Trash2 className="h-4 w-4" /></div>
                                        </Button>
                                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden ${item.image ? 'bg-gray-100' : bg}`}>
                                            {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <ItemIcon className={`h-4 w-4 ${color}`} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{item.name}</p>
                                            <p className="text-[10px] text-gray-500">{item.type}</p>
                                        </div>
                                    </div>
                                );
                            })}
                            {rightItems.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-50 pb-20">
                                    <Package className="h-12 w-12 mb-2" />
                                    <p className="text-sm">Túi đang trống</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
