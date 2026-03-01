"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Navbar } from "@/components/layout";
import { RoleGuard } from "@/components/auth";
import { fetchUserById, updateUserRole, updateUserInfo, UserItem } from "@/lib/api";

const ROLES = ["user", "artist", "admin"];

export default function AdminUserDetailPage() {
    return (
        <div className="flex flex-col h-screen">
            <Navbar />
            <RoleGuard roles={["admin"]}>
                <UserDetailPanel />
            </RoleGuard>
        </div>
    );
}

function UserDetailPanel() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();

    const [user, setUser] = useState<UserItem | null>(null);
    const [loading, setLoading] = useState(true);

    // Edit info form
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [savingInfo, setSavingInfo] = useState(false);

    // Role form
    const [role, setRole] = useState("");
    const [savingRole, setSavingRole] = useState(false);

    useEffect(() => {
        fetchUserById(id)
            .then((u) => {
                setUser(u);
                setName(u.name);
                setEmail(u.email);
                setRole(u.role);
            })
            .catch(() => toast.error("User not found"))
            .finally(() => setLoading(false));
    }, [id]);

    const handleSaveInfo = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingInfo(true);
        try {
            const updated = await updateUserInfo(id, { name, email });
            setUser(updated);
            toast.success("User info updated!");
        } catch {
            toast.error("Failed to update user info");
        } finally {
            setSavingInfo(false);
        }
    };

    const handleSaveRole = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingRole(true);
        try {
            const updated = await updateUserRole(id, role);
            setUser(updated);
            toast.success(`Role updated to ${role}`);
        } catch {
            toast.error("Failed to update role");
        } finally {
            setSavingRole(false);
        }
    };

    const roleColor: Record<string, string> = {
        admin: "bg-red-100 text-red-700",
        artist: "bg-purple-100 text-purple-700",
        user: "bg-blue-100 text-blue-700",
    };

    if (loading) return (
        <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-2 rounded-full animate-spin border-t-transparent" style={{ borderColor: "var(--accent)" }} />
        </div>
    );

    if (!user) return (
        <div className="flex-1 flex items-center justify-center">
            <div className="glass rounded-2xl p-10 text-center">
                <p className="text-4xl mb-3">👤</p>
                <p className="font-semibold">User not found</p>
                <Link href="/admin" className="btn-glass mt-4 inline-block text-sm !py-2 !px-4">← Back to Admin</Link>
            </div>
        </div>
    );

    return (
        <div className="flex-1 overflow-auto p-4 md:p-8">
            <div className="max-w-xl mx-auto space-y-6 pb-10">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gradient">Edit User</h1>
                        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Admin · User Management</p>
                    </div>
                    <Link href="/admin" className="btn-glass text-sm !py-2 !px-4">← Admin</Link>
                </div>

                {/* User Badge */}
                <div className="glass rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold" style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-bold text-lg">{user.name}</p>
                        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{user.email}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold mt-1 inline-block ${roleColor[user.role] || ""}`}>
                            {user.role}
                        </span>
                    </div>
                </div>

                {/* Edit Info */}
                <form onSubmit={handleSaveInfo} className="glass rounded-2xl p-6 space-y-4 slide-up">
                    <h2 className="font-bold text-base">Edit Information</h2>
                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted)" }}>Full Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="glass-input w-full px-3 py-2.5 text-sm" required />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted)" }}>Email Address</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="glass-input w-full px-3 py-2.5 text-sm" required />
                    </div>
                    <button type="submit" disabled={savingInfo} className="btn-accent w-full text-sm">
                        {savingInfo ? "Saving..." : "Save Info"}
                    </button>
                </form>

                {/* Change Role */}
                <form onSubmit={handleSaveRole} className="glass rounded-2xl p-6 space-y-4 slide-up">
                    <h2 className="font-bold text-base">Change Role</h2>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        Changing to <strong>artist</strong> lets this user upload tracks. <strong>Admin</strong> grants full access.
                    </p>
                    <div className="flex gap-2 flex-wrap">
                        {ROLES.map((r) => (
                            <button
                                key={r}
                                type="button"
                                onClick={() => setRole(r)}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${role === r
                                        ? "btn-accent"
                                        : "btn-glass"
                                    }`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                    <button type="submit" disabled={savingRole || role === user.role} className="btn-glass w-full text-sm" style={{ opacity: role === user.role ? 0.5 : 1 }}>
                        {savingRole ? "Updating..." : `Set Role to "${role}"`}
                    </button>
                </form>

                {/* Meta */}
                <div className="glass rounded-2xl p-5 text-xs" style={{ color: "var(--text-muted)" }}>
                    <p>User ID: <span className="font-mono">{user.id}</span></p>
                    <p className="mt-1">Joined: {new Date(user.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                </div>
            </div>
        </div>
    );
}
