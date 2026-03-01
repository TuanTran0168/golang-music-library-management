"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Navbar } from "@/components/layout";
import { RoleGuard } from "@/components/auth";
import { fetchMe, updateMe, changePassword, UserItem } from "@/lib/api";
import { getUser, setAuth, getToken } from "@/lib/auth";

export default function ProfilePage() {
    return (
        <div className="flex flex-col h-screen">
            <Navbar />
            <RoleGuard roles={["admin", "artist", "user"]}>
                <ProfileDashboard />
            </RoleGuard>
        </div>
    );
}

function ProfileDashboard() {
    const [user, setUser] = useState<UserItem | null>(null);
    const [loading, setLoading] = useState(true);

    // Info form
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [savingInfo, setSavingInfo] = useState(false);

    // Password form
    const [currentPwd, setCurrentPwd] = useState("");
    const [newPwd, setNewPwd] = useState("");
    const [confirmPwd, setConfirmPwd] = useState("");
    const [changingPwd, setChangingPwd] = useState(false);

    useEffect(() => {
        fetchMe()
            .then((u) => {
                setUser(u);
                setName(u.name);
                setEmail(u.email);
            })
            .catch(() => toast.error("Failed to load profile"))
            .finally(() => setLoading(false));
    }, []);

    const handleSaveInfo = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingInfo(true);
        try {
            const updated = await updateMe({ name, email });
            setUser(updated);
            // Sync localStorage so Navbar reflects new name immediately
            const token = getToken();
            if (token) setAuth(token, { ...getUser()!, name: updated.name, email: updated.email });
            toast.success("Profile updated!");
        } catch {
            toast.error("Failed to update profile");
        } finally {
            setSavingInfo(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPwd !== confirmPwd) {
            toast.error("New passwords do not match");
            return;
        }
        setChangingPwd(true);
        try {
            await changePassword({ current_password: currentPwd, new_password: newPwd });
            toast.success("Password changed successfully!");
            setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to change password";
            toast.error(msg);
        } finally {
            setChangingPwd(false);
        }
    };

    const roleColor: Record<string, string> = {
        admin: "bg-red-100 text-red-700",
        artist: "bg-purple-100 text-purple-700",
        user: "bg-blue-100 text-blue-700",
    };

    if (loading) return (
        <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-accent rounded-full animate-spin border-t-transparent" style={{ borderColor: "var(--accent)" }} />
        </div>
    );

    return (
        <div className="flex-1 overflow-auto p-4 md:p-8">
            <div className="max-w-xl mx-auto space-y-6 pb-10">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gradient">My Profile</h1>
                        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Manage your account information</p>
                    </div>
                    <Link href="/" className="btn-glass text-sm !py-2 !px-4">← Back</Link>
                </div>

                {/* User badge */}
                {user && (
                    <div className="glass rounded-2xl p-5 flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold" style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="font-bold text-lg">{user.name}</p>
                            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{user.email}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold mt-1 inline-block ${roleColor[user.role] || "bg-gray-100 text-gray-600"}`}>
                                {user.role}
                            </span>
                        </div>
                    </div>
                )}

                {/* Edit Info */}
                <form onSubmit={handleSaveInfo} className="glass rounded-2xl p-6 space-y-4 slide-up">
                    <h2 className="font-bold text-base">Basic Information</h2>
                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted)" }}>Full Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="glass-input w-full px-3 py-2.5 text-sm"
                            placeholder="Your full name"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted)" }}>Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="glass-input w-full px-3 py-2.5 text-sm"
                            placeholder="your@email.com"
                            required
                        />
                    </div>
                    <button type="submit" disabled={savingInfo} className="btn-accent w-full text-sm">
                        {savingInfo ? "Saving..." : "Save Changes"}
                    </button>
                </form>

                {/* Change Password */}
                <form onSubmit={handleChangePassword} className="glass rounded-2xl p-6 space-y-4 slide-up">
                    <h2 className="font-bold text-base">Change Password</h2>
                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted)" }}>Current Password</label>
                        <input type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} className="glass-input w-full px-3 py-2.5 text-sm" required />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted)" }}>New Password</label>
                        <input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} className="glass-input w-full px-3 py-2.5 text-sm" minLength={6} required />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted)" }}>Confirm New Password</label>
                        <input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} className="glass-input w-full px-3 py-2.5 text-sm" minLength={6} required />
                    </div>
                    <button type="submit" disabled={changingPwd} className="btn-glass w-full text-sm">
                        {changingPwd ? "Changing..." : "Change Password"}
                    </button>
                </form>
            </div>
        </div>
    );
}
