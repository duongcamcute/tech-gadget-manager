
"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { loginUser } from "@/app/actions";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Card } from "@/components/ui/primitives"; // Simplified imports
import { Loader2, Sparkles, ArrowRight, Lock, User as UserIcon } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const loginStore = useAuthStore((state) => state.login);
    const router = useRouter();
    const { toast } = useToast();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await loginUser(username, password);
            if (res.success && res.user) {
                loginStore(res.user as any);
                toast("Đăng nhập thành công!", "success");
                router.push("/");
            } else {
                toast(res.error || "Đăng nhập thất bại", "error");
            }
        } catch (err: any) {
            console.error(err);
            toast("Lỗi kết nối: " + (err.message || "Không xác định"), "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 overflow-hidden relative">
            {/* Ambient Background Effects - Explicitly warm colors */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-orange-400/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-red-400/10 rounded-full blur-[100px]" />

            <div className="w-full max-w-md relative z-10 perspective-1000">
                <div className="bg-white/80 backdrop-blur-2xl border border-white/40 shadow-2xl rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-[0_20px_50px_rgba(234,88,12,0.15)] hover:scale-[1.002]">

                    {/* Header Section */}
                    <div className="p-8 pt-10 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-80" />

                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-100 to-red-50 mb-6 shadow-inner ring-1 ring-orange-200">
                            <Sparkles className="w-8 h-8 text-orange-600" />
                        </div>

                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-gray-900 to-gray-600 mb-2">
                            Chào mừng trở lại
                        </h1>
                        <p className="text-orange-600/80 text-sm font-medium tracking-wide">
                            TECH GADGET MANAGER
                        </p>
                    </div>

                    {/* Form Section */}
                    <div className="p-8 pt-0 pb-10">
                        <form onSubmit={handleLogin} className="space-y-5">
                            <div className="space-y-2 group">
                                <Label htmlFor="username" className="text-xs font-semibold uppercase text-muted-foreground ml-1">Tài khoản</Label>
                                <div className="relative transition-transform duration-200 group-focus-within:scale-[1.01]">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                                        <UserIcon className="w-4 h-4" />
                                    </div>
                                    <Input
                                        id="username"
                                        placeholder="admin"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        disabled={loading}
                                        className="pl-10 h-12 bg-white/50 border-gray-200/50 focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 group">
                                <Label htmlFor="password" className="text-xs font-semibold uppercase text-muted-foreground ml-1">Mật khẩu</Label>
                                <div className="relative transition-transform duration-200 group-focus-within:scale-[1.01]">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                                        <Lock className="w-4 h-4" />
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={loading}
                                        className="pl-10 h-12 bg-white/50 border-gray-200/50 focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 text-base font-bold rounded-xl bg-gradient-to-r from-primary to-orange-600 hover:from-primary/90 hover:to-orange-600/90 shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98] mt-4"
                                disabled={loading}
                            >
                                {loading ? (
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                ) : (
                                    <span className="flex items-center gap-2">
                                        Đăng nhập hệ thống <ArrowRight className="w-4 h-4" />
                                    </span>
                                )}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
