"use client";

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
}

export function Checkbox({ className, checked, onCheckedChange, ...props }: CheckboxProps) {
    return (
        <div
            className={cn(
                "h-5 w-5 rounded-md border-2 flex items-center justify-center cursor-pointer transition-all",
                checked ? "bg-primary-600 border-primary-600 text-white" : "border-gray-300 bg-white hover:border-primary-400",
                className
            )}
            onClick={(e) => {
                e.stopPropagation();
                onCheckedChange?.(!checked);
            }}
        >
            {checked && <Check size={14} strokeWidth={3} />}
            <input
                type="checkbox"
                className="hidden"
                checked={checked}
                onChange={e => onCheckedChange?.(e.target.checked)}
                {...props}
            />
        </div>
    )
}
