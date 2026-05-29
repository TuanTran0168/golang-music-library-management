"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { RoleGuard } from "@/components/auth";
import { fetchUsers, updateUserRole, UserItem } from "@/lib/api";

export default function AdminPage() {
    return (
        <RoleGuard roles={["admin"]}>
            <AdminDashboard />
        </RoleGuard>
    );
}

function AdminDashboard() {
    const [users, setUsers] = useState<UserItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const limit = 20;

    // Role change modal state
    const [roleModal, setRoleModal] = useState<{ user: UserItem; newRole: string } | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        setLoading(true);
        fetchUsers(page, limit)
            .then((res) => {
                setUsers(res.data || []);
                setTotalCount(res.total_count || 0);
            })
            .finally(() => setLoading(false));
    }, [page]);

    const openRoleModal = (user: UserItem, newRole: string) => {
        if (user.role === newRole) return;
        setRoleModal({ user, newRole });
    };

    const handleConfirmRole = async () => {
        if (!roleModal) return;
        setSubmitting(true);
        try {
            await updateUserRole(roleModal.user.id, roleModal.newRole);
            setUsers((prev) =>
                prev.map((u) =>
                    u.id === roleModal.user.id ? { ...u, role: roleModal.newRole } : u
                )
            );
            toast.success(`${roleModal.user.name} → ${roleModal.newRole}`);
            setRoleModal(null);
        } catch {
            toast.error("Failed to update role");
        } finally {
            setSubmitting(false);
        }
    };

    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    const roleGradient: Record<string, string> = {
        admin:  "linear-gradient(135deg, #ff453a, #ff6b6b)",
        artist: "linear-gradient(135deg, #bf5af2, #9f44d3)",
        user:   "linear-gradient(135deg, #2997ff, #0062cc)",
    };

    const roleColor: Record<string, string> = {
        admin:  "#ff453a",
        artist: "#bf5af2",
        user:   "#2997ff",
    };

    return (
        <div className="flex-1 overflow-auto p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gradient">Admin Dashboard</h1>
                        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                            Manage users and their roles ({totalCount} total)
                        </p>
                    </div>
                    <Link href="/" className="btn-sm" style={{ textDecoration: "none" }}>← Back</Link>
                </div>

                {loading ? (
                    <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>
                        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        Loading users...
                    </div>
                ) : (
                    <>
                        <div className="space-y-2">
                            {users.map((user) => (
                                <div key={user.id} className="glass-card !rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 fade-in">
                                    <Link href={`/admin/users/${user.id}`} className="flex-1 min-w-0 group">
                                        <p className="font-semibold text-sm group-hover:text-accent transition">{user.name}</p>
                                        <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>{user.email}</p>
                                    </Link>

                                    <div className="flex items-center gap-2">
                                        <Link href={`/admin/users/${user.id}`} className="btn-sm" style={{ textDecoration: "none" }}>
                                            Edit
                                        </Link>
                                        <div className="relative">
                                            <select
                                                value={user.role}
                                                onChange={(e) => openRoleModal(user, e.target.value)}
                                                className="role-select"
                                                style={{ color: roleColor[user.role] ?? "var(--text-secondary)" }}
                                            >
                                                {["user", "artist", "admin"].map((r) => (
                                                    <option key={r} value={r}>{r}</option>
                                                ))}
                                            </select>
                                            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-[10px]" style={{ color: roleColor[user.role] }}>▾</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 py-6">
                                <button className="pagination-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>‹</button>
                                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{page} / {totalPages}</span>
                                <button className="pagination-btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>›</button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Role Change Confirmation Modal */}
            {roleModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !submitting && setRoleModal(null)} />
                    <div className="glass rounded-2xl p-6 w-full max-w-sm relative slide-up text-center">
                        <p className="text-3xl mb-4">👤</p>
                        <h3 className="text-lg font-bold mb-2">Change Role</h3>
                        <p className="text-sm mb-1">
                            <span className="font-semibold">{roleModal.user.name}</span>
                        </p>
                        <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
                            <span className="capitalize font-medium">{roleModal.user.role}</span>
                            <span className="mx-2">→</span>
                            <span className="capitalize font-bold" style={{ background: roleGradient[roleModal.newRole] ?? "var(--accent)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                                {roleModal.newRole}
                            </span>
                        </p>

                        <div className="flex gap-3 justify-center">
                            <button onClick={() => setRoleModal(null)} disabled={submitting} className="btn-glass">
                                Cancel
                            </button>
                            <button onClick={handleConfirmRole} disabled={submitting} className="btn-accent">
                                {submitting ? "Updating..." : "Confirm"}
                            </button>
                        </div>

                        <button
                            onClick={() => !submitting && setRoleModal(null)}
                            className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition text-sm"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
