"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/primitives";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ITEM_ICON_GROUPS, ITEM_ICONS } from "@/lib/constants/options";

interface IconSelectProps {
    value: string;
    onValueChange: (value: string) => void;
    className?: string;
    groups?: { label: string; items: string[] }[];
    iconMap?: Record<string, any>;
}

export function IconSelect({
    value,
    onValueChange,
    className,
    groups = ITEM_ICON_GROUPS,
    iconMap = ITEM_ICONS
}: IconSelectProps) {
    const [open, setOpen] = React.useState(false);

    // Get current icon or default
    const currentCategory = value || "default";
    const { icon: CurrentIcon, color: currentColor, bg: currentBg } = iconMap[currentCategory] || iconMap["default"] || ITEM_ICONS["default"];

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between h-10 bg-white px-3 text-left", className)}
                >
                    <div className="flex items-center gap-2 overflow-hidden flex-1">
                        <div className={cn("w-6 h-6 rounded-md flex items-center justify-center shrink-0", currentBg)}>
                            <CurrentIcon className={cn("w-4 h-4", currentColor)} />
                        </div>
                        <span className="truncate text-xs font-medium text-gray-700">
                            {value ? value : "Chọn icon..."}
                        </span>
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0 shadow-xl z-[200]" align="start">
                <div className="max-h-[300px] overflow-y-auto p-2">
                    {groups.map((group) => (
                        <div key={group.label} className="mb-3">
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
                                {group.label}
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {group.items.map((key) => {
                                    const itemIcon = iconMap[key];
                                    if (!itemIcon) return null;
                                    const { icon: Icon, color, bg } = itemIcon;
                                    const isSelected = value === key;

                                    return (
                                        <div
                                            key={key}
                                            onClick={() => {
                                                onValueChange(key);
                                                setOpen(false);
                                            }}
                                            className={cn(
                                                "cursor-pointer rounded-lg p-2 flex flex-col items-center gap-1 border transition-all hover:shadow-md",
                                                isSelected ? "border-primary-500 bg-primary-50" : "border-transparent hover:bg-gray-50"
                                            )}
                                            title={key}
                                        >
                                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", bg)}>
                                                <Icon className={cn("w-5 h-5", color)} />
                                            </div>
                                            <span className="text-[10px] font-medium text-gray-600 truncate w-full text-center">
                                                {key}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
}
