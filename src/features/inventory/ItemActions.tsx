"use client";

import { Button, Input, Label } from "@/components/ui/primitives";
import { lendItem, returnItem } from "@/features/lending/actions";
import { UserMinus, RotateCcw, Check, X, Calendar, Copy } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

export function ItemActions({ item }: { item: any }) {
    const [isLending, setIsLending] = useState(false);
    const [borrower, setBorrower] = useState("");
    const [dueDate, setDueDate] = useState("");
    const { toast } = useToast();
    const router = useRouter();

    async function handleLend() {
        if (!borrower) {
            toast("Vui lòng nhập tên người mượn", "error");
            return;
        }

        await lendItem(item.id, borrower, dueDate ? new Date(dueDate) : undefined);
        setIsLending(false);
        setBorrower("");
        setDueDate("");
        toast(`Đã xác nhận cho ${borrower} mượn`, "success");
        router.refresh();
    }

    async function handleReturn() {
        if (confirm("Xác nhận món đồ này đã được trả lại?")) {
            await returnItem(item.id);
            toast("Đã ghi nhận trả đồ", "success");
            router.refresh();
        }
    }

    if (item.status === 'Lent') {
        return (
            <div className="mt-2 text-right">
                <Button className="h-7 px-3 text-xs bg-primary-100 text-primary-700 hover:bg-primary-200 border-primary-200 shadow-none" onClick={handleReturn}>
                    <RotateCcw className="h-3 w-3 mr-1.5" /> Đánh dấu đã trả
                </Button>
            </div>
        );
    }

    if (isLending) {
        return (
            <div className="mt-2 p-3 bg-primary-50 rounded-xl border border-primary-100 animate-in fade-in zoom-in-95 space-y-2">
                <div className="space-y-1">
                    <Label className="text-[10px] uppercase text-primary-500 font-bold">Người mượn</Label>
                    <Input
                        value={borrower}
                        onChange={e => setBorrower(e.target.value)}
                        placeholder="Tên..."
                        className="h-7 text-xs bg-white"
                        autoFocus
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-[10px] uppercase text-primary-500 font-bold flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Dự kiến trả (Đến ngày)
                    </Label>
                    <Input
                        type="date"
                        value={dueDate}
                        onChange={e => setDueDate(e.target.value)}
                        className="h-7 text-xs bg-white"
                    />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                    <Button className="h-7 px-2 text-xs bg-white text-gray-500 hover:bg-gray-100 border" onClick={() => setIsLending(false)}>Hủy</Button>
                    <Button className="h-7 px-2 text-xs bg-primary-500 text-white hover:bg-primary-600 font-bold" onClick={handleLend}>
                        Xác nhận
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="mt-2 text-right flex justify-end gap-2">
            <Button
                className="h-7 w-7 p-0 rounded-full text-gray-500 hover:text-primary-600 hover:bg-gray-100 border-0 shadow-none"
                variant="ghost"
                onClick={() => router.push(`/?clone=${item.id}`)}
                title="Sao chép / Tạo bản sao"
            >
                <Copy className="h-4 w-4" />
            </Button>
            <Button className="h-7 px-3 text-xs text-muted-foreground bg-transparent hover:bg-secondary border shadow-none group-hover:bg-white group-hover:border-primary-200 group-hover:text-primary-600 transition-colors" onClick={() => setIsLending(true)}>
                <UserMinus className="h-3.5 w-3.5 mr-1.5" /> Cho mượn
            </Button>
        </div>
    );
}
