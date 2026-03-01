"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { User } from "@/types/auth";
import { getUser, logout } from "@/lib/auth";
import { AuthModal } from "@/components/auth";

export default function Navbar() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [showAuth, setShowAuth] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [avatarError, setAvatarError] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const drawerRef = useRef<HTMLDivElement>(null);

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

    // Close drawer on outside click
    useEffect(() => {
        if (!mobileMenuOpen) return;
        const handler = (e: MouseEvent) => {
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

    return (
        <>
            <header
                className="flex items-center justify-between px-4 md:px-8 h-14 flex-shrink-0 transition-all duration-300 z-30 relative"
                style={{
                    background: scrolled ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.65)",
                    backdropFilter: "blur(48px) saturate(200%)",
                    WebkitBackdropFilter: "blur(48px) saturate(200%)",
                    borderBottom: "1px solid rgba(0,0,0,0.08)",
                    boxShadow: scrolled ? "0 2px 20px rgba(0,0,0,0.07)" : "none",
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
                <div className="hidden sm:flex items-center gap-3 shrink-0">
                    {user ? (
                        <>
                            <Link
                                href="/profile"
                                className="flex items-center gap-2 px-2.5 py-1.5 rounded-full transition-all hover:opacity-80 active:scale-95"
                                style={{
                                    background: "var(--accent-light)",
                                    border: "1px solid rgba(0,98,204,0.15)",
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
                                border: "1px solid rgba(0,98,204,0.15)",
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
                            <span className="text-xs font-semibold max-w-[80px] truncate" style={{ color: "var(--accent)" }}>
                                {fullName}
                            </span>
                        </Link>
                    )}

                    {/* Hamburger */}
                    <button
                        onClick={() => setMobileMenuOpen(o => !o)}
                        className="w-9 h-9 flex flex-col items-center justify-center gap-[5px] rounded-xl transition-all active:scale-90"
                        style={{
                            background: mobileMenuOpen ? "var(--accent-light)" : "rgba(255,255,255,0.72)",
                            border: "1px solid rgba(0,0,0,0.09)",
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
                    maxHeight: mobileMenuOpen ? "400px" : "0px",
                    opacity: mobileMenuOpen ? 1 : 0,
                    pointerEvents: mobileMenuOpen ? "auto" : "none",
                }}
            >
                <div
                    ref={drawerRef}
                    className="mx-3 mt-1 rounded-2xl p-4 flex flex-col gap-2"
                    style={{
                        background: "rgba(255,255,255,0.90)",
                        backdropFilter: "blur(40px) saturate(200%)",
                        border: "1px solid rgba(0,0,0,0.08)",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
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
                                background: "rgba(0,0,0,0.035)",
                            }}
                        >
                            {link.label}
                        </Link>
                    ))}

                    {/* Divider */}
                    <div className="my-1" style={{ height: 1, background: "var(--separator)" }} />

                    {/* Auth action */}
                    {user ? (
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-medium transition-all"
                            style={{ background: "rgba(255,59,48,0.08)", color: "#c0392b" }}
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
