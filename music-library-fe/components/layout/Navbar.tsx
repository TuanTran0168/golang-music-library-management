"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { User } from "@/types/auth";
import { getUser, logout } from "@/lib/auth";
import { AuthModal } from "@/components/auth";
import { useTheme } from "@/hooks/useTheme";

// ── Sun / Moon SVG icons ───────────────────────────────────────────────────
function SunIcon() {
    return (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <line x1="12" y1="2" x2="12" y2="5" /><line x1="12" y1="19" x2="12" y2="22" />
            <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" /><line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
            <line x1="2" y1="12" x2="5" y2="12" /><line x1="19" y1="12" x2="22" y2="12" />
            <line x1="4.22" y1="19.78" x2="6.34" y2="17.66" /><line x1="17.66" y1="6.34" x2="19.78" y2="4.22" />
        </svg>
    );
}
function MoonIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
    );
}

// ── Theme toggle button ────────────────────────────────────────────────────
function ThemeToggle() {
    const { isDark, toggle } = useTheme();
    return (
        <button
            onClick={toggle}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Light mode" : "Dark mode"}
            className="relative w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 active:scale-90"
            style={{
                background: isDark ? "rgba(41,151,255,0.15)" : "rgba(0,0,0,0.055)",
                border: isDark ? "1px solid rgba(41,151,255,0.30)" : "1px solid rgba(0,0,0,0.10)",
                color: isDark ? "#2997FF" : "#515154",
            }}
        >
            <span
                className="absolute inset-0 flex items-center justify-center transition-all duration-300"
                style={{ opacity: isDark ? 0 : 1, transform: isDark ? "rotate(90deg) scale(0.6)" : "rotate(0) scale(1)" }}
            >
                <MoonIcon />
            </span>
            <span
                className="absolute inset-0 flex items-center justify-center transition-all duration-300"
                style={{ opacity: isDark ? 1 : 0, transform: isDark ? "rotate(0) scale(1)" : "rotate(-90deg) scale(0.6)" }}
            >
                <SunIcon />
            </span>
        </button>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function Navbar() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [showAuth, setShowAuth] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [avatarError, setAvatarError] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const drawerRef = useRef<HTMLDivElement>(null);
    const hamburgerRef = useRef<HTMLButtonElement>(null);
    const { isDark, toggle: toggleTheme } = useTheme();

    useEffect(() => {
        setUser(getUser());
        const onLogout = () => { setUser(null); router.push("/"); };
        window.addEventListener("auth:logout", onLogout);
        const onScroll = () => setScrolled(window.scrollY > 4);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => {
            window.removeEventListener("auth:logout", onLogout);
            window.removeEventListener("scroll", onScroll);
        };
    }, [router]);

    // Close drawer on outside click — exclude the hamburger button itself
    useEffect(() => {
        if (!mobileMenuOpen) return;
        const handler = (e: MouseEvent) => {
            // Ignore clicks on the hamburger toggle button (it has its own click handler)
            if (hamburgerRef.current?.contains(e.target as Node)) return;
            if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
                setMobileMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [mobileMenuOpen]);

    const handleAuthSuccess = () => {
        setUser(getUser());
        setShowAuth(false);
    };

    const handleLogout = async () => {
        await logout();
        setUser(null);
        setMobileMenuOpen(false);
        router.push("/");
    };

    const navLinks = [{ href: "/artist", label: "🎙 Studio" }];
    if (user) navLinks.push({ href: "/profile", label: "👤 Profile" });
    if (user?.role === "admin") navLinks.push({ href: "/admin", label: "⚙️ Admin" });

    const initials = user ? user.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "";
    const fullName = user?.name ?? "";

    const headerBg = isDark
        ? (scrolled ? "rgba(10,10,18,0.92)" : "rgba(10,10,18,0.70)")
        : (scrolled ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.65)");

    return (
        <>
            <header
                className="flex items-center justify-between px-4 md:px-8 h-14 flex-shrink-0 transition-all duration-300 z-30 relative"
                style={{
                    background: headerBg,
                    backdropFilter: "blur(48px) saturate(200%)",
                    WebkitBackdropFilter: "blur(48px) saturate(200%)",
                    borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)"}`,
                    boxShadow: scrolled ? (isDark ? "0 2px 20px rgba(0,0,0,0.3)" : "0 2px 20px rgba(0,0,0,0.07)") : "none",
                }}
            >
                {/* Logo */}
                <Link href="/" className="text-base md:text-lg font-bold tracking-tight hover:opacity-70 transition-opacity shrink-0">
                    <span className="text-gradient">Improok</span>
                    <span style={{ color: "var(--text-primary)" }}> Music</span>
                </Link>

                {/* Desktop nav — hidden on mobile */}
                <nav className="hidden sm:flex items-center gap-5">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="text-sm font-medium transition-opacity hover:opacity-50"
                            style={{ color: "var(--text-secondary)" }}
                        >
                            {link.label.replace(/^[^\s]+\s/, "")}
                        </Link>
                    ))}
                </nav>

                {/* Right — desktop */}
                <div className="hidden sm:flex items-center gap-2 shrink-0">
                    {/* Dark mode toggle */}
                    <ThemeToggle />

                    {user ? (
                        <>
                            <Link
                                href="/profile"
                                className="flex items-center gap-2 px-2.5 py-1.5 rounded-full transition-all hover:opacity-80 active:scale-95"
                                style={{
                                    background: "var(--accent-light)",
                                    border: "1px solid rgba(41,151,255,0.20)",
                                    textDecoration: "none",
                                    maxWidth: 200,
                                }}
                            >
                                <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-[11px] font-bold"
                                    style={{ background: "var(--accent)", color: "#fff" }}>
                                    {!avatarError ? (
                                        <Image src="/default-avatar.png" alt="avatar" width={24} height={24}
                                            className="w-full h-full object-cover" onError={() => setAvatarError(true)} />
                                    ) : <span>{initials}</span>}
                                </div>
                                <span className="text-sm font-semibold truncate" style={{ color: "var(--accent)" }}>
                                    {fullName}
                                </span>
                            </Link>
                            <button onClick={handleLogout} className="btn-glass text-sm !py-1.5 !px-4 !min-h-0">
                                Sign Out
                            </button>
                        </>
                    ) : (
                        <button onClick={() => setShowAuth(true)} className="btn-accent text-sm !py-2 !px-5">
                            Sign In
                        </button>
                    )}
                </div>

                {/* Mobile right — avatar chip + hamburger */}
                <div className="flex sm:hidden items-center gap-2 shrink-0">
                    {user && (
                        <Link
                            href="/profile"
                            className="flex items-center gap-1.5 px-2 py-1 rounded-full transition-all active:scale-95"
                            style={{
                                background: "var(--accent-light)",
                                border: "1px solid rgba(41,151,255,0.20)",
                                textDecoration: "none",
                            }}
                        >
                            <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-[10px] font-bold"
                                style={{ background: "var(--accent)", color: "#fff" }}>
                                {!avatarError ? (
                                    <Image src="/default-avatar.png" alt="avatar" width={24} height={24}
                                        className="w-full h-full object-cover" onError={() => setAvatarError(true)} />
                                ) : <span>{initials}</span>}
                            </div>
                            <span className="text-xs font-semibold max-w-[72px] truncate" style={{ color: "var(--accent)" }}>
                                {fullName}
                            </span>
                        </Link>
                    )}

                    {/* Hamburger */}
                    <button
                        ref={hamburgerRef}
                        onClick={() => setMobileMenuOpen(o => !o)}
                        className="w-9 h-9 flex flex-col items-center justify-center gap-[5px] rounded-xl transition-all active:scale-90"
                        style={{
                            background: mobileMenuOpen
                                ? "var(--accent-light)"
                                : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.055)",
                            border: `1px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.09)"}`,
                        }}
                        aria-label="Open menu"
                    >
                        <span className="block w-[18px] h-[2px] rounded-full transition-all duration-200"
                            style={{ background: "var(--text-primary)", transform: mobileMenuOpen ? "translateY(7px) rotate(45deg)" : "none" }} />
                        <span className="block w-[18px] h-[2px] rounded-full transition-all duration-200"
                            style={{ background: "var(--text-primary)", opacity: mobileMenuOpen ? 0 : 1 }} />
                        <span className="block w-[18px] h-[2px] rounded-full transition-all duration-200"
                            style={{ background: "var(--text-primary)", transform: mobileMenuOpen ? "translateY(-7px) rotate(-45deg)" : "none" }} />
                    </button>
                </div>
            </header>

            {/* Mobile drawer — slides down */}
            <div
                className="fixed top-14 left-0 right-0 z-20 sm:hidden overflow-hidden transition-all duration-300 ease-out"
                style={{
                    maxHeight: mobileMenuOpen ? "500px" : "0px",
                    opacity: mobileMenuOpen ? 1 : 0,
                    pointerEvents: mobileMenuOpen ? "auto" : "none",
                }}
            >
                <div
                    ref={drawerRef}
                    className="mx-3 mt-1 rounded-2xl p-4 flex flex-col gap-2"
                    style={{
                        background: isDark ? "rgba(16,16,24,0.95)" : "rgba(255,255,255,0.92)",
                        backdropFilter: "blur(40px) saturate(200%)",
                        border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                        boxShadow: isDark
                            ? "0 8px 32px rgba(0,0,0,0.50)"
                            : "0 8px 32px rgba(0,0,0,0.12)",
                    }}
                >
                    {/* Nav links */}
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all active:scale-98"
                            style={{
                                color: "var(--text-primary)",
                                fontWeight: 500,
                                fontSize: 15,
                                textDecoration: "none",
                                background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.035)",
                            }}
                        >
                            {link.label}
                        </Link>
                    ))}

                    {/* Dark mode toggle row */}
                    <button
                        onClick={() => { toggleTheme(); }}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all active:scale-98"
                        style={{
                            color: "var(--text-primary)",
                            fontWeight: 500,
                            fontSize: 15,
                            background: isDark ? "rgba(41,151,255,0.10)" : "rgba(0,0,0,0.035)",
                            border: isDark ? "1px solid rgba(41,151,255,0.20)" : "1px solid transparent",
                        }}
                    >
                        <span>{isDark ? "☀️" : "🌙"}</span>
                        <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
                    </button>

                    {/* Divider */}
                    <div className="my-1" style={{ height: 1, background: "var(--separator)" }} />

                    {/* Auth action */}
                    {user ? (
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-medium transition-all"
                            style={{ background: "rgba(255,59,48,0.08)", color: "#FF3B30" }}
                        >
                            🚪 Sign Out
                        </button>
                    ) : (
                        <button
                            onClick={() => { setShowAuth(true); setMobileMenuOpen(false); }}
                            className="btn-accent w-full !py-3 text-sm"
                        >
                            Sign In
                        </button>
                    )}
                </div>
            </div>

            {/* Backdrop overlay when mobile menu open */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 top-14 z-10 sm:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {showAuth && <AuthModal onSuccess={handleAuthSuccess} onClose={() => setShowAuth(false)} />}
        </>
    );
}
