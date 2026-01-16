import { PRESET_COLORS } from "@/components/ui/ColorPicker";

export function getColorHex(colorName: string): string {
    if (!colorName) return "#e5e7eb"; // gray-200
    if (colorName.startsWith('#')) return colorName;

    // Try to match preset first
    const preset = PRESET_COLORS.find(p => p.name.toLowerCase() === colorName.toLowerCase());
    if (preset) return preset.hex;

    // Common fallback mappings
    const map: Record<string, string> = {
        'đen': '#000000',
        'black': '#000000',
        'trắng': '#ffffff',
        'white': '#ffffff',
        'xám': '#6b7280',
        'gray': '#6b7280',
        'grey': '#6b7280',
        'đỏ': '#ef4444',
        'red': '#ef4444',
        'xanh dương': '#3b82f6',
        'blue': '#3b82f6',
        'xanh lá': '#22c55e',
        'green': '#22c55e',
        'vàng': '#eab308',
        'yellow': '#eab308',
        'cam': '#f97316',
        'orange': '#f97316',
        'tím': '#a855f7',
        'purple': '#a855f7',
        'hồng': '#ec4899',
        'pink': '#ec4899',
        'undefined': '#e5e7eb',
        'null': '#e5e7eb'
    };

    return map[colorName.toLowerCase()] || '#9ca3af'; // default gray-400
}
