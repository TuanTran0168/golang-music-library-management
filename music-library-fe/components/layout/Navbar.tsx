"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import {
    BarChart3,
    Mic2,
    Clock,
    User,
    ShieldCheck,
    Sun,
    Moon,
    LogOut,
    LogIn,
    type LucideIcon,
} from "lucide-react";
import { logout } from "@/lib/auth";
import { useAuth, refreshAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/auth";
import { useTheme } from "@/hooks/useTheme";

// ── Types ──────────────────────────────────────────────────────────────────
type NavLink = { href: string; label: string; Icon: LucideIcon };

// ── Theme toggle ───────────────────────────────────────────────────────────
function ThemeToggle() {
    const { isDark, toggle } = useTheme();
    return (
        <button
            onClick={toggle}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
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
                <Moon size={15} />
            </span>
            <span
                className="absolute inset-0 flex items-center justify-center transition-all duration-300"
                style={{ opacity: isDark ? 1 : 0, transform: isDark ? "rotate(0) scale(1)" : "rotate(-90deg) scale(0.6)" }}
            >
                <Sun size={16} />
            </span>
        </button>
    );
}

// ── Navbar ─────────────────────────────────────────────────────────────────
export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const { user, mounted } = useAuth();
    const [showAuth, setShowAuth] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [avatarError, setAvatarError] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const drawerRef = useRef<HTMLDivElement>(null);
    const hamburgerRef = useRef<HTMLButtonElement>(null);
    const { isDark, toggle: toggleTheme } = useTheme();

    // Navigate home when auth:logout fires from outside (e.g. token expiry)
    useEffect(() => {
        const onLogout = () => router.push("/");
        window.addEventListener("auth:logout", onLogout);
        return () => window.removeEventListener("auth:logout", onLogout);
    }, [router]);

    // Scroll shadow
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 4);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // Close drawer on outside click
    useEffect(() => {
        if (!mobileMenuOpen) return;
        const handler = (e: MouseEvent) => {
            if (hamburgerRef.current?.contains(e.target as Node)) return;
            if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
                setMobileMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [mobileMenuOpen]);

    const handleAuthSuccess = () => { refreshAuth(); setShowAuth(false); };

    const handleLogout = async () => {
        await logout();
        refreshAuth();
        setMobileMenuOpen(false);
        router.push("/");
    };

    const navLinks: NavLink[] = [
        { href: "/dashboard", label: "Charts",  Icon: BarChart3   },
        { href: "/artist",    label: "Studio",  Icon: Mic2        },
    ];
    if (mounted && user) {
        navLinks.push({ href: "/history", label: "History", Icon: Clock       });
        navLinks.push({ href: "/profile", label: "Profile", Icon: User        });
    }
    if (mounted && user?.role === "admin") {
        navLinks.push({ href: "/admin", label: "Admin", Icon: ShieldCheck });
    }

    const initials = user ? user.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() : "";
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

                {/* Desktop nav */}
                <nav className="hidden sm:flex items-center gap-1">
                    {navLinks.map(({ href, label, Icon }) => {
                        const active = pathname === href;
                        return (
                            <Link
                                key={href}
                                href={href}
                                className="flex items-center gap-1.5 px-2 py-1 text-sm font-medium transition-all duration-150"
                                style={{
                                    color: active ? "var(--accent)" : "var(--text-secondary)",
                                    background: "transparent",
                                    fontWeight: active ? 700 : 500,
                                    borderBottom: active ? "2px solid var(--accent)" : "2px solid transparent",
                                    borderRadius: 0,
                                    paddingBottom: 2,
                                    textDecoration: "none",
                                }}
                            >
                                <Icon size={14} strokeWidth={active ? 2.5 : 2} />
                                {label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Right — desktop */}
                <div className="hidden sm:flex items-center gap-2 shrink-0">
                    <ThemeToggle />
                    {mounted && user ? (
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
                                <div
                                    className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-[11px] font-bold"
                                    style={{ background: "var(--accent)", color: "#fff" }}
                                >
                                    {!avatarError ? (
                                        <Image src="/default-avatar.png" alt="avatar" width={24} height={24}
                                            className="w-full h-full object-cover" onError={() => setAvatarError(true)} />
                                    ) : <span>{initials}</span>}
                                </div>
                                <span className="text-sm font-semibold truncate" style={{ color: "var(--accent)" }}>
                                    {fullName}
                                </span>
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="btn-sm flex items-center gap-1.5"
                            >
                                <LogOut size={14} />
                                Sign Out
                            </button>
                        </>
                    ) : mounted ? (
                        <button
                            onClick={() => setShowAuth(true)}
                            className="btn-sm btn-sm-accent flex items-center gap-1.5"
                        >
                            <LogIn size={14} />
                            Sign In
                        </button>
                    ) : null}
                </div>

                {/* Mobile right — avatar chip + hamburger */}
                <div className="flex sm:hidden items-center gap-2 shrink-0">
                    {mounted && user && (
                        <Link
                            href="/profile"
                            className="flex items-center gap-1.5 px-2 py-1 rounded-full transition-all active:scale-95"
                            style={{
                                background: "var(--accent-light)",
                                border: "1px solid rgba(41,151,255,0.20)",
                                textDecoration: "none",
                            }}
                        >
                            <div
                                className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-[10px] font-bold"
                                style={{ background: "var(--accent)", color: "#fff" }}
                            >
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

            {/* Mobile drawer */}
            <div
                className="fixed top-14 left-0 right-0 z-20 sm:hidden overflow-hidden transition-all duration-300 ease-out"
                style={{
                    maxHeight: mobileMenuOpen ? "600px" : "0px",
                    opacity: mobileMenuOpen ? 1 : 0,
                    pointerEvents: mobileMenuOpen ? "auto" : "none",
                }}
            >
                <div
                    ref={drawerRef}
                    className="mx-3 mt-1 rounded-2xl overflow-hidden"
                    style={{
                        background: isDark ? "rgba(16,16,24,0.97)" : "rgba(255,255,255,0.97)",
                        backdropFilter: "blur(40px) saturate(200%)",
                        border: `1px solid ${isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.08)"}`,
                        boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.55)" : "0 8px 32px rgba(0,0,0,0.12)",
                    }}
                >
                    {/* Nav links section */}
                    <div className="p-2">
                        {navLinks.map(({ href, label, Icon }) => {
                            const active = pathname === href;
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all active:scale-[0.98] mb-0.5"
                                    style={{
                                        textDecoration: "none",
                                        color: active ? "var(--accent)" : "var(--text-primary)",
                                        background: active
                                            ? "var(--accent-light)"
                                            : isDark ? "transparent" : "transparent",
                                        fontWeight: active ? 600 : 500,
                                    }}
                                >
                                    <span
                                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                        style={{
                                            background: active
                                                ? "rgba(41,151,255,0.18)"
                                                : isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                                            color: active ? "var(--accent)" : "var(--text-secondary)",
                                        }}
                                    >
                                        <Icon size={16} strokeWidth={active ? 2.5 : 2} />
                                    </span>
                                    <span className="text-[15px]">{label}</span>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Divider */}
                    <div style={{ height: 1, background: "var(--separator)", margin: "0 12px" }} />

                    {/* Theme + Auth section */}
                    <div className="p-2">
                        {/* Dark mode toggle */}
                        <button
                            onClick={() => toggleTheme()}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full transition-all active:scale-[0.98] mb-0.5"
                            style={{
                                color: "var(--text-primary)",
                                fontWeight: 500,
                            }}
                        >
                            <span
                                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{
                                    background: isDark ? "rgba(41,151,255,0.15)" : "rgba(0,0,0,0.05)",
                                    color: isDark ? "#2997FF" : "var(--text-secondary)",
                                }}
                            >
                                {isDark ? <Sun size={16} /> : <Moon size={16} />}
                            </span>
                            <span className="text-[15px]">{isDark ? "Light Mode" : "Dark Mode"}</span>
                        </button>

                        {/* Auth action */}
                        {mounted && user ? (
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full transition-all active:scale-[0.98]"
                                style={{ color: "#FF3B30", fontWeight: 500 }}
                            >
                                <span
                                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                    style={{ background: "rgba(255,59,48,0.10)", color: "#FF3B30" }}
                                >
                                    <LogOut size={16} />
                                </span>
                                <span className="text-[15px]">Sign Out</span>
                            </button>
                        ) : mounted ? (
                            <button
                                onClick={() => { setShowAuth(true); setMobileMenuOpen(false); }}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full transition-all active:scale-[0.98]"
                                style={{ color: "var(--accent)", fontWeight: 500 }}
                            >
                                <span
                                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                    style={{ background: "var(--accent-light)", color: "var(--accent)" }}
                                >
                                    <LogIn size={16} />
                                </span>
                                <span className="text-[15px]">Sign In</span>
                            </button>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* Backdrop */}
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
