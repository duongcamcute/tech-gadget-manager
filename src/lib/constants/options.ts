import { Package, Zap, HardDrive, Cable, Battery, Headphones, Database } from "lucide-react";

export const ITEM_TYPES = [
    { value: "Charger", label: "Củ sạc" },
    { value: "Cable", label: "Dây cáp" },
    { value: "PowerBank", label: "Sạc dự phòng" },
    { value: "Storage", label: "Lưu trữ" },
    { value: "Hub", label: "Hub" },
    { value: "Audio", label: "Âm thanh" },
    { value: "Other", label: "Khác" },
] as const;

export const ITEM_STATUS = {
    Available: { label: "Sẵn sàng", color: "bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-100" },
    InUse: { label: "Đang dùng", color: "bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-100" },
    Lent: { label: "Cho mượn", color: "bg-primary-50 text-primary-700 border-primary-200 ring-1 ring-primary-100" },
    Lost: { label: "Thất lạc", color: "bg-red-50 text-red-700 border-red-200 ring-1 ring-red-100" },
} as const;

export const ITEM_ICONS: Record<string, any> = {
    'Charger': { icon: Zap, color: 'text-amber-600', bg: 'bg-amber-100' },
    'Cable': { icon: Cable, color: 'text-blue-600', bg: 'bg-blue-100' },
    'Storage': { icon: HardDrive, color: 'text-purple-600', bg: 'bg-purple-100' },
    'PowerBank': { icon: Battery, color: 'text-green-600', bg: 'bg-green-100' },
    'Audio': { icon: Headphones, color: 'text-pink-600', bg: 'bg-pink-100' },
    'Hub': { icon: Database, color: 'text-cyan-600', bg: 'bg-cyan-100' },
    'default': { icon: Package, color: 'text-gray-600', bg: 'bg-gray-100' }
};
