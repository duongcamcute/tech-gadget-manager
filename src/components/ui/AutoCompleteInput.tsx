"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, Input } from "@/components/ui/primitives";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
// Use primitive Input for consistency (already imported above)

interface AutoCompleteInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    suggestions: string[];
    onValueChange: (value: string) => void;
    value: string;
}

export function AutoCompleteInput({ suggestions, value, onValueChange, className, placeholder, ...props }: AutoCompleteInputProps) {
    const [open, setOpen] = React.useState(false);
    const [inputValue, setInputValue] = React.useState(value);

    // Sync internal state with external value
    React.useEffect(() => {
        setInputValue(value);
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = e.target.value;
        setInputValue(newVal);
        onValueChange(newVal);
        setOpen(true); // Open on type
    };

    const handleSelect = (currentValue: string) => {
        setInputValue(currentValue);
        onValueChange(currentValue);
        setOpen(false);
    };

    return (
        <div className="relative group w-full">
            <Input
                {...props}
                value={inputValue}
                onChange={handleInputChange}
                onFocus={() => setOpen(true)}
                onBlur={() => setTimeout(() => setOpen(false), 200)} // Delay to allow click
                className={cn("w-full transition-all", className)}
                placeholder={placeholder}
                autoComplete="off"
            />

            {/* Dropdown Menu - Custom built for absolute control */}
            {open && suggestions.length > 0 && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-[200px] overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                    {suggestions.filter(s => s.toLowerCase().includes(inputValue.toLowerCase())).map((suggestion) => (
                        <div
                            key={suggestion}
                            className="px-3 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 cursor-pointer transition-colors"
                            onMouseDown={(e) => {
                                e.preventDefault(); // Prevent input blur
                                handleSelect(suggestion);
                            }}
                        >
                            {suggestion}
                        </div>
                    ))}
                    {suggestions.filter(s => s.toLowerCase().includes(inputValue.toLowerCase())).length === 0 && (
                        <div className="px-3 py-2 text-xs text-gray-400 italic text-center">
                            Không có gợi ý phù hợp
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
