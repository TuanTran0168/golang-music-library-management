"use client";

import { useSyncExternalStore } from "react";
import { getUser } from "@/lib/auth";
import { User } from "@/types/auth";

// ── Module-level auth store ─────────────────────────────────────────────────
// Mirrors useTheme: single source of truth, event-driven updates.
// useSyncExternalStore gives an SSR-safe server snapshot (no user, not initialized)
// and a client snapshot (reads localStorage once, then serves from cache).

type AuthState = { user: User | null; initialized: boolean };

let _state: AuthState = { user: null, initialized: false };
const _listeners = new Set<() => void>();
let _eventsRegistered = false;

function _notify() {
    _listeners.forEach(fn => fn());
}

function _ensureEvents() {
    if (_eventsRegistered || typeof window === "undefined") return;
    _eventsRegistered = true;
    window.addEventListener("auth:login", () => {
        _state = { user: getUser(), initialized: true };
        _notify();
    });
    window.addEventListener("auth:logout", () => {
        _state = { user: null, initialized: true };
        _notify();
    });
}

function _read(): AuthState {
    _ensureEvents();
    if (!_state.initialized) {
        try {
            _state = { user: getUser(), initialized: true };
        } catch {
            _state = { user: null, initialized: true };
        }
    }
    return _state;
}

function _subscribe(notify: () => void) {
    _ensureEvents();
    _listeners.add(notify);
    return () => { _listeners.delete(notify); };
}

const _serverState: AuthState = { user: null, initialized: false };

// ── Public API ──────────────────────────────────────────────────────────────

// Call after login or any mutation that changes the stored user.
export function refreshAuth() {
    try {
        _state = { user: getUser(), initialized: true };
    } catch {
        _state = { user: null, initialized: true };
    }
    _notify();
}

// ── Hook ────────────────────────────────────────────────────────────────────
export function useAuth() {
    const { user, initialized } = useSyncExternalStore(_subscribe, _read, () => _serverState);
    // `mounted` mirrors the old `useState(false)` + `setMounted(true)` pattern.
    // It is false during SSR/hydration and true once the client snapshot is used.
    return { user, mounted: initialized };
}
