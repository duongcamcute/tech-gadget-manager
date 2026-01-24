"use client";

import { useEffect } from 'react';
import { useThemeStore } from '@/store/useThemeStore';

export function ThemeInitializer() {
    const { mode } = useThemeStore();

    useEffect(() => {
        const root = document.documentElement;

        // Helper to sync
        const syncTheme = () => {
            root.classList.remove('light', 'dark');
            if (mode === 'system') {
                const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (isDark) root.classList.add('dark');
            } else {
                root.classList.add(mode);
            }
        };

        syncTheme();

        // Listen for system changes only if mode is system
        if (mode === 'system') {
            const media = window.matchMedia('(prefers-color-scheme: dark)');
            const listener = (e: MediaQueryListEvent) => {
                root.classList.remove('light', 'dark');
                if (e.matches) root.classList.add('dark');
            };
            media.addEventListener('change', listener);
            return () => media.removeEventListener('change', listener);
        }
    }, [mode]);

    return null;
}
