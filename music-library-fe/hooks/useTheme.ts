"use client";

import { useSyncExternalStore, useCallback } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "improok-theme";

// ── Module-level theme store ─────────────────────────────────────────────────
// Single source of truth for the active theme on the client.
// useSyncExternalStore will call _read() for the client snapshot and
// () => "light" for the server snapshot — keeping SSR HTML consistent.

let _cache: Theme | null = null;
const _listeners = new Set<() => void>();

function _read(): Theme {
    if (_cache !== null) return _cache;
    try {
        const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
        _cache = stored ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    } catch {
        _cache = "light";
    }
    return _cache;
}

function _write(next: Theme) {
    _cache = next;
    try {
        localStorage.setItem(STORAGE_KEY, next);
        if (next === "dark") {
            document.documentElement.setAttribute("data-theme", "dark");
        } else {
            document.documentElement.removeAttribute("data-theme");
        }
    } catch {}
    _listeners.forEach((fn) => fn());
}

function _subscribe(notify: () => void) {
    _listeners.add(notify);
    return () => { _listeners.delete(notify); };
}

// ── Hook ────────────────────────────────────────────────────────────────────
export function useTheme() {
    // Server snapshot is always "light" → matches SSR HTML → no hydration mismatch.
    // Client snapshot reads localStorage once, then serves from _cache.
    const theme = useSyncExternalStore(_subscribe, _read, () => "light" as Theme);

    const setTheme = useCallback((next: Theme) => _write(next), []);
    const toggle = useCallback(() => _write(_read() === "light" ? "dark" : "light"), []);

    return { theme, setTheme, toggle, isDark: theme === "dark" };
}
