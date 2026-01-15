
"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { LogOut, Settings, User, ChevronDown, Sparkles } from "lucide-react";

export default function UserMenu() {
    const { user, logout } = useAuthStore();
    const router = useRouter();
    const [open, setOpen] = useState(false);

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    if (!user) return null;

    // Get initials or first char
    const displayName = user.fullName || user.username;
    const initials = displayName.substring(0, 2).toUpperCase();

    // Use Avatars
    const AvatarImage = () => {
        if (user.avatar) {
            return <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />;
        }
        return <>{initials}</>;
    };

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="group flex items-center gap-3 pl-1 pr-3 py-1 bg-white/80 backdrop-blur-sm border border-primary-100/50 hover:border-primary-200 rounded-full transition-all hover:shadow-md shadow-sm"
            >
                <div className="h-9 w-9 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-inner ring-2 ring-white overflow-hidden">
                    <AvatarImage />
                </div>
                <div className="flex flex-col items-start mr-1">
                    <span className="text-xs font-semibold text-gray-700 leading-tight max-w-[100px] truncate">{displayName}</span>
                    <span className="text-[10px] text-primary-600 font-medium leading-none">Admin</span>
                </div>
                <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 mt-3 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-primary-100/50 py-2 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right ring-1 ring-black/5">

                        <div className="px-5 py-4 border-b border-primary-50/50 bg-gradient-to-b from-primary-50/30 to-transparent">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-12 w-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary-500/20 overflow-hidden">
                                    <AvatarImage />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="font-bold text-gray-900 truncate">{displayName}</p>
                                    <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-2 space-y-1">
                            <button
                                onClick={() => { router.push("/settings"); setOpen(false); }}
                                className="w-full text-left px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-xl flex items-center gap-3 transition-colors group"
                            >
                                <div className="p-1.5 bg-gray-100 group-hover:bg-primary-100 rounded-lg text-gray-500 group-hover:text-primary-600 transition-colors">
                                    <Settings className="w-4 h-4" />
                                </div>
                                Cài đặt hệ thống
                            </button>

                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl flex items-center gap-3 transition-colors group"
                            >
                                <div className="p-1.5 bg-red-50 group-hover:bg-red-100 rounded-lg text-red-500 group-hover:text-red-600 transition-colors">
                                    <LogOut className="w-4 h-4" />
                                </div>
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
