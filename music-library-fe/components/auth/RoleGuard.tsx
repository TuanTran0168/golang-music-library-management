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
        if (!isLoggedIn()) {
            setAllowed(false);
            setChecked(true);
            return;
        }
        const user = getUser();
        setAllowed(!!user && roles.includes(user.role));
        setChecked(true);
    }, [roles]);

    if (!checked) return null;

    if (!allowed) {
        return fallback || (
            <div className="flex-1 flex items-center justify-center">
                <div className="glass rounded-2xl p-10 text-center max-w-sm">
                    <p className="text-4xl mb-4">🔒</p>
                    <h2 className="text-xl font-bold mb-2">Access Denied</h2>
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        You don&apos;t have permission to view this page.
                    </p>
                    <Link href="/" className="btn-accent inline-block mt-4 text-sm !py-2 !px-5">
                        Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
