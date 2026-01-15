
"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
    const { isLoggedIn, user, login } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        // Apply theme colors if user has them
        if (user?.colors) {
            try {
                const colors = JSON.parse(user.colors);
                const root = document.documentElement;
                Object.entries(colors).forEach(([key, value]) => {
                    root.style.setProperty(key, value as string);
                });
            } catch (e) { console.error("Error parsing theme colors", e); }
        }

        if (!isLoggedIn && pathname !== "/login") {
            router.push("/login");
        } else if (isLoggedIn && pathname === "/login") {
            router.push("/");
        }
    }, [isLoggedIn, pathname, router, mounted, user]);

    if (!mounted) return <div className="h-screen w-full flex items-center justify-center bg-background text-foreground">Loading...</div>;

    if (!isLoggedIn && pathname !== "/login") return null; // Prevent flash of content

    return <>{children}</>;
}
