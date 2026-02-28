"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Navbar } from "@/components/layout";
import { RoleGuard } from "@/components/auth";
import { fetchUsers, updateUserRole, UserItem } from "@/lib/api";

export default function AdminPage() {
    return (
        <div className="flex flex-col h-screen">
            <Navbar />
            <RoleGuard roles={["admin"]}>
                <AdminDashboard />
            </RoleGuard>
        </div>
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

    const roleColor: Record<string, string> = {
        admin: "from-red-500 to-orange-500",
        artist: "from-purple-500 to-pink-500",
        user: "from-blue-500 to-cyan-500",
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
                    <Link href="/" className="btn-glass text-sm !py-2 !px-4">← Back to Home</Link>
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
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm">{user.name}</p>
                                        <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>{user.email}</p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {["user", "artist", "admin"].map((role) => (
                                            <button
                                                key={role}
                                                onClick={() => openRoleModal(user, role)}
                                                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition capitalize ${user.role === role
                                                    ? `bg-gradient-to-r ${roleColor[role] || "from-purple-500 to-pink-500"} text-white shadow`
                                                    : "bg-white/5 hover:bg-white/10"
                                                    }`}
                                                style={user.role !== role ? { color: "var(--text-secondary)" } : {}}
                                            >
                                                {role}
                                            </button>
                                        ))}
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
                            <span className={`capitalize font-bold bg-gradient-to-r ${roleColor[roleModal.newRole]} bg-clip-text text-transparent`}>
                                {roleModal.newRole}
                            </span>
                        </p>

                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => setRoleModal(null)}
                                disabled={submitting}
                                className="btn-glass text-sm !py-2 !px-5"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmRole}
                                disabled={submitting}
                                className="btn-accent text-sm !py-2 !px-5"
                            >
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
