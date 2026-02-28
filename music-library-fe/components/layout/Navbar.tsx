"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User } from "@/types/auth";
import { getUser, logout } from "@/lib/auth";
import { AuthModal } from "@/components/auth";

export default function Navbar() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [showAuth, setShowAuth] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUser(getUser());
    }, []);

    const handleAuthSuccess = () => {
        setUser(getUser());
        setShowAuth(false);
    };

    const handleLogout = () => {
        logout();
        setUser(null);
        router.push("/");
    };

    const navLinks = [];
    if (user) {
        navLinks.push({ href: "/artist", label: "🎤 Studio" });
    }
    if (user && user.role === "admin") {
        navLinks.push({ href: "/admin", label: "⚙️ Admin" });
    }

    return (
        <>
            <header className="glass flex items-center justify-between px-4 md:px-6 py-3 border-b border-white/10 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-xl md:text-2xl font-extrabold text-gradient hover:opacity-80 transition">
                        Improok Music
                    </Link>
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="hidden sm:inline text-sm font-medium hover:text-white transition"
                            style={{ color: "var(--text-secondary)" }}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    {navLinks.length > 0 && (
                        <div className="flex sm:hidden gap-2">
                            {navLinks.map((link) => (
                                <Link key={link.href} href={link.href} className="btn-glass text-xs !py-1.5 !px-2">
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    )}

                    {user ? (
                        <div className="flex items-center gap-3">
                            <div className="hidden sm:block text-right">
                                <p className="text-sm font-semibold">{user.name}</p>
                                <p className="text-xs capitalize" style={{ color: "var(--text-muted)" }}>{user.role}</p>
                            </div>
                            <button onClick={handleLogout} className="btn-glass text-sm !py-2 !px-4">Logout</button>
                        </div>
                    ) : (
                        <button onClick={() => setShowAuth(true)} className="btn-accent text-sm !py-2 !px-5">Sign In</button>
                    )}
                </div>
            </header>

            {showAuth && <AuthModal onSuccess={handleAuthSuccess} onClose={() => setShowAuth(false)} />}
        </>
    );
}
