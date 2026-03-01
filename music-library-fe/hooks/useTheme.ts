"use client";

import { useEffect, useState, useCallback } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "improok-theme";

function getSystemTheme(): Theme {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
    const root = document.documentElement;
    if (theme === "dark") {
        root.setAttribute("data-theme", "dark");
    } else {
        root.removeAttribute("data-theme");
    }
}

export function useTheme() {
    const [theme, setThemeState] = useState<Theme>("light");

    // Initialize from localStorage (or system preference)
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
        const initial = stored ?? getSystemTheme();
        setThemeState(initial);
        applyTheme(initial);
    }, []);

    const setTheme = useCallback((next: Theme) => {
        setThemeState(next);
        localStorage.setItem(STORAGE_KEY, next);
        applyTheme(next);
    }, []);

    const toggle = useCallback(() => {
        setThemeState(prev => {
            const next: Theme = prev === "light" ? "dark" : "light";
            localStorage.setItem(STORAGE_KEY, next);
            applyTheme(next);
            return next;
        });
    }, []);

    return { theme, setTheme, toggle, isDark: theme === "dark" };
}
