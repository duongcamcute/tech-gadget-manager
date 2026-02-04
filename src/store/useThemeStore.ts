import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
    mode: ThemeMode;
    setMode: (mode: ThemeMode) => void;
    toggleMode: () => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            mode: 'light', // Default to light mode
            setMode: (mode) => {
                set({ mode });
                applyTheme(mode);
            },
            toggleMode: () => {
                const current = get().mode;
                const next: ThemeMode = current === 'dark' ? 'light' : current === 'light' ? 'dark' : 'dark';
                set({ mode: next });
                applyTheme(next);
            },
        }),
        {
            name: 'theme-storage',
            onRehydrateStorage: () => (state) => {
                if (state) {
                    applyTheme(state.mode);
                }
            },
        }
    )
);

export function applyTheme(mode: ThemeMode) {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    root.classList.remove('light', 'dark');

    if (mode === 'system') {
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (systemDark) {
            root.classList.add('dark');
        } else {
            // Optional: root.classList.add('light'); 
        }
        return;
    }

    root.classList.add(mode);
}

// Initialize theme on load
if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('theme-storage');
    if (stored) {
        try {
            const { state } = JSON.parse(stored);
            if (state?.mode) {
                applyTheme(state.mode);
            }
        } catch {
            // Ignore parse errors, apply default
            applyTheme('light');
        }
    } else {
        // No stored preference, apply default light mode
        applyTheme('light');
    }
}
