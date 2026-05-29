"use client";

import Link from "next/link";
import { useEffect, useState, ReactNode } from "react";
import { getUser, isLoggedIn } from "@/lib/auth";

interface Props {
    roles: string[];
    children: ReactNode;
    fallback?: ReactNode;
}

export default function RoleGuard({ roles, children, fallback }: Props) {
    const [allowed, setAllowed] = useState(false);
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        const user = getUser();
        setAllowed(isLoggedIn() && !!user && roles.includes(user.role));
        setChecked(true);
    }, [roles]);

    // Server + hydration: render nothing (avoids mismatch with localStorage-dependent checks)
    if (!checked) return null;

    if (!allowed) {
        return fallback || (
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="glass-card rounded-2xl p-8 text-center max-w-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-3" style={{ color: "var(--text-muted)" }}>
                        Restricted
                    </p>
                    <h2 className="text-xl font-bold mb-2">Access Denied</h2>
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        You do not have permission to view this page.
                    </p>
                    <Link href="/" className="btn-sm btn-sm-accent inline-flex mt-5" style={{ textDecoration: "none" }}>
                        Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
