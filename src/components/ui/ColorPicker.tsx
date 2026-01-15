"use client";

import * as React from "react";
import { Check, Plus, Pipette } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button, Input, Label } from "@/components/ui/primitives";

export const PRESET_COLORS = [
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

interface ColorPickerProps {
    value?: string;
    onChange: (colorName: string) => void;
    className?: string;
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
    const [open, setOpen] = React.useState(false);
    const [customMode, setCustomMode] = React.useState(false);
    const [customName, setCustomName] = React.useState("");
    const [customHex, setCustomHex] = React.useState("#000000");

    // Helper to find preset
    const selectedPreset = PRESET_COLORS.find(c => c.name === value);

    const handleSelectPreset = (colorName: string) => {
        onChange(colorName);
        setOpen(false);
        setCustomMode(false);
    };

    const handleApplyCustom = () => {
        if (!customName) return;
        onChange(customName);
        // Ideally we would save the hex mapping somewhere, but for now we just use the name
        // In a real app we might pass { name, hex } up
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <div className={cn("h-10 border rounded-xl flex items-center px-2 bg-white cursor-pointer hover:border-primary-300 transition-colors gap-2", className)}>
                    <div className={cn("w-6 h-6 rounded-full shadow-sm border flex-shrink-0",
                        selectedPreset?.class || "bg-gradient-to-br from-gray-100 to-gray-200")}
                        style={!selectedPreset ? { backgroundColor: 'gray' } : {}}
                    >
                        {/* If it's a known custom color (not in presets), maybe try to show it? Use a generic icon for now if unknown */}
                        {!selectedPreset && value && <div className="w-full h-full rounded-full bg-gray-400" />}
                    </div>
                    <span className="text-sm font-medium text-gray-700 flex-1 truncate">
                        {value || "Chọn màu..."}
                    </span>
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3 rounded-xl shadow-xl z-[999]" align="start">
                {!customMode ? (
                    <div className="grid grid-cols-4 gap-2">
                        {PRESET_COLORS.map((c) => (
                            <div
                                key={c.name}
                                onClick={() => handleSelectPreset(c.name)}
                                className={cn("flex flex-col items-center gap-1 cursor-pointer hover:bg-gray-50 p-1 rounded-lg group", value === c.name && "bg-primary-50")}
                            >
                                <div className={cn("w-8 h-8 rounded-full shadow-sm transition-transform group-hover:scale-110", c.class, value === c.name && "ring-2 ring-primary-500 ring-offset-2")}></div>
                                <span className="text-[10px] text-gray-500 text-center leading-tight truncate w-full">{c.name}</span>
                            </div>
                        ))}
                        {/* Add Custom Button */}
                        <div
                            onClick={() => setCustomMode(true)}
                            className="flex flex-col items-center gap-1 cursor-pointer hover:bg-gray-50 p-1 rounded-lg group"
                        >
                            <div className="w-8 h-8 rounded-full shadow-sm bg-white border border-dashed border-gray-300 flex items-center justify-center text-gray-400 group-hover:border-primary-500 group-hover:text-primary-500 transition-colors">
                                <Plus className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] text-gray-500 text-center leading-tight">Khác</span>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-200">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-bold uppercase text-gray-500">Màu tùy chỉnh</Label>
                            <Button variant="ghost" size="sm" onClick={() => setCustomMode(false)} className="h-6 px-2 text-xs">Quay lại</Button>
                        </div>
                        <div className="space-y-2">
                            <div>
                                <Label className="text-xs">Mã màu</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="color"
                                        value={customHex}
                                        onChange={(e) => setCustomHex(e.target.value)}
                                        className="w-10 h-9 p-1 cursor-pointer px-1"
                                    />
                                    <Input
                                        value={customHex}
                                        onChange={(e) => setCustomHex(e.target.value)}
                                        className="flex-1 h-9 font-mono text-xs"
                                        placeholder="#..."
                                    />
                                </div>
                            </div>
                            <div>
                                <Label className="text-xs">Tên màu</Label>
                                <Input
                                    value={customName}
                                    onChange={(e) => setCustomName(e.target.value)}
                                    placeholder="Vd: Xanh Navy..."
                                    className="h-9"
                                />
                            </div>
                            <Button onClick={handleApplyCustom} className="w-full h-9 bg-primary-600 hover:bg-primary-700 text-white">
                                <Check className="w-4 h-4 mr-2" /> Áp dụng
                            </Button>
                        </div>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
