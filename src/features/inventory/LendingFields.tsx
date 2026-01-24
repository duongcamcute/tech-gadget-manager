"use client";

import React from "react";
import { Input, Label } from "@/components/ui/primitives";
import { UseFormReturn } from "react-hook-form";

interface LendingFieldsProps {
    form: UseFormReturn<any>;
    contacts: any[]; // List of suggestions
}

export function LendingFields({ form, contacts }: LendingFieldsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-primary-50/80 dark:bg-gray-800/80 rounded-xl border border-primary-200 dark:border-gray-700 animate-in fade-in zoom-in-95">
            <div className="col-span-1 md:col-span-3 pb-1 border-b border-primary-200/50 dark:border-gray-700/50 mb-1">
                <h4 className="text-xs font-bold text-primary-700 uppercase flex items-center gap-2">
                    📦 Thông tin Cho Mượn
                </h4>
            </div>
            <div className="space-y-1.5">
                <Label className="text-primary-800 dark:text-primary-300 text-xs font-semibold">Người mượn <span className="text-red-400">*</span></Label>
                <div className="relative">
                    <Input
                        list="list-contacts-lending"
                        {...form.register("borrowerName")}
                        placeholder="Nhập tên..."
                        className="h-9 bg-white dark:bg-gray-900 border-primary-300 dark:border-gray-600 focus:border-primary-500"
                    />
                    <datalist id="list-contacts-lending">
                        {contacts.map(c => <option key={c.id} value={c.name} />)}
                    </datalist>
                </div>
            </div>
            <div className="space-y-1.5">
                <Label className="text-primary-800 dark:text-primary-300 text-xs font-semibold">Ngày mượn</Label>
                <Input
                    type="date"
                    {...form.register("borrowDate")}
                    className="h-9 bg-white dark:bg-gray-900 border-primary-300 dark:border-gray-600 focus:border-primary-500"
                />
            </div>
            <div className="space-y-1.5">
                <Label className="text-primary-800 dark:text-primary-300 text-xs font-semibold">Dự kiến trả (Tuỳ chọn)</Label>
                <Input
                    type="date"
                    {...form.register("dueDate")}
                    className="h-9 bg-white dark:bg-gray-900 border-primary-300 dark:border-gray-600 focus:border-primary-500"
                />
            </div>
        </div>
    );
}
