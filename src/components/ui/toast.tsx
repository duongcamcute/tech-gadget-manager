"use client";

import * as React from "react";
import { Check, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    toast: (message: string, type?: ToastType) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = React.useState<Toast[]>([]);

    const toast = React.useCallback((message: string, type: ToastType = "info") => {
        const id = Math.random().toString(36).substring(7);
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={cn(
                            "pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border animate-in slide-in-from-right-full fade-in duration-300 min-w-[300px]",
                            t.type === "success" && "bg-white border-emerald-100 text-emerald-800",
                            t.type === "error" && "bg-white border-red-100 text-red-800",
                            t.type === "info" && "bg-white border-blue-100 text-blue-800"
                        )}
                    >
                        {t.type === "success" && <div className="p-1 bg-emerald-100 rounded-full"><Check className="h-4 w-4 text-emerald-600" /></div>}
                        {t.type === "error" && <div className="p-1 bg-red-100 rounded-full"><AlertCircle className="h-4 w-4 text-red-600" /></div>}
                        <p className="text-sm font-medium flex-1">{t.message}</p>
                        <button onClick={() => removeToast(t.id)} className="text-muted-foreground hover:text-foreground">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export const useToast = () => {
    const context = React.useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
};
