"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { RoleGuard } from "@/components/auth";
import { UploadTrack } from "@/components/track";
import { ConfirmModal } from "@/components/common";
import { Track, Playlist, Paginated } from "@/types/music";
import { fetchTracks, deleteTrack, fetchPlaylists, createPlaylist, deletePlaylist, DEFAULT_PAGE_SIZE } from "@/lib/api";
import { getUser, isLoggedIn } from "@/lib/auth";
import { AuthModal } from "@/components/auth";
import { useTheme } from "@/hooks/useTheme";

const formatDuration = (s: number) => {
    if (isNaN(s) || s < 0) return "0:00";
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
};

export default function ArtistPage() {
    const [showAuth, setShowAuth] = useState(false);
    const loggedIn = isLoggedIn();

    const UnauthenticatedFallback = (
        <div className="flex-1 flex items-center justify-center p-4">
            <div className="glass rounded-2xl p-10 text-center max-w-sm">
                <p className="text-4xl mb-4">🎵</p>
                <h2 className="text-xl font-bold mb-2">Artist Studio</h2>
                <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
                    {loggedIn ? "You don't have permission to access the Studio." : "Please sign in to access your Studio."}
                </p>
                {!loggedIn ? (
                    <button onClick={() => setShowAuth(true)} className="btn-accent">Sign In</button>
                ) : (
                    <Link href="/" className="btn-accent" style={{ textDecoration: "none" }}>Back to Home</Link>
                )}
            </div>
            {showAuth && <AuthModal onSuccess={() => window.location.reload()} onClose={() => setShowAuth(false)} />}
        </div>
    );

    return (
        <RoleGuard roles={["admin", "artist", "user"]} fallback={UnauthenticatedFallback}>
            <ArtistDashboard />
        </RoleGuard>
    );
}

function ArtistDashboard() {
    const user = getUser();
    const { isDark } = useTheme();
    const [tab, setTab] = useState<"tracks" | "playlists">(user?.role === "user" ? "playlists" : "tracks");
    const [tracks, setTracks] = useState<Track[]>([]);
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [refetchKey, setRefetchKey] = useState(0);

    const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
    const [newPlaylistTitle, setNewPlaylistTitle] = useState("");
    const [creating, setCreating] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState<
        { type: "track"; item: Track } | { type: "playlist"; item: Playlist } | null
    >(null);
    const [deleting, setDeleting] = useState(false);

    const totalPages = Math.max(1, Math.ceil(totalCount / DEFAULT_PAGE_SIZE));

    useEffect(() => {
        setLoading(true);
        if (tab === "tracks") {
            fetchTracks(page, DEFAULT_PAGE_SIZE, true)
                .then((res: Paginated<Track>) => { setTracks(res.data || []); setTotalCount(res.total_count || 0); })
                .finally(() => setLoading(false));
        } else {
            fetchPlaylists(1, 100, true)
                .then((pls) => { setPlaylists(pls); setTotalCount(pls.length); })
                .finally(() => setLoading(false));
        }
    }, [page, refetchKey, tab]);

    useEffect(() => { setPage(1); }, [tab]);

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            if (deleteTarget.type === "track") {
                await deleteTrack(deleteTarget.item.id);
                toast.success(`Deleted "${(deleteTarget.item as Track).title}"`);
            } else {
                await deletePlaylist(deleteTarget.item.id);
                toast.success(`Deleted "${(deleteTarget.item as Playlist).title}"`);
            }
            setDeleteTarget(null);
            setRefetchKey((k) => k + 1);
        } catch {
            toast.error(`Failed to delete ${deleteTarget.type}`);
        } finally {
            setDeleting(false);
        }
    };

    const handleCreatePlaylist = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPlaylistTitle.trim()) return;
        setCreating(true);
        try {
            const fd = new FormData();
            fd.append("title", newPlaylistTitle);
            await createPlaylist(fd);
            toast.success(`Created "${newPlaylistTitle}"`);
            setNewPlaylistTitle("");
            setShowCreatePlaylist(false);
            setRefetchKey((k) => k + 1);
        } catch {
            toast.error("Failed to create playlist");
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-auto p-4 md:p-8 pb-8">
                <div className="max-w-4xl mx-auto">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Link href="/" className="text-xs flex items-center gap-1 hover:opacity-80 transition-opacity" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
                                    ← Back to Dashboard
                                </Link>
                            </div>
                            <h1
                                className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text leading-tight"
                                style={{ backgroundImage: "linear-gradient(135deg, var(--accent) 0%, #e9b3ff 100%)" }}
                            >
                                Artist Studio
                            </h1>
                            <p className="text-sm mt-1.5" style={{ color: "var(--text-muted)" }}>
                                Manage your creative workspace and {playlists.length} public playlist{playlists.length !== 1 ? "s" : ""}.
                            </p>
                        </div>

                        {/* Tab toggle */}
                        <div
                            className="flex gap-1 p-1 rounded-2xl flex-shrink-0"
                            style={{
                                background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                                border: "1px solid var(--glass-border)",
                            }}
                        >
                            {user?.role !== "user" && (
                                <button
                                    onClick={() => setTab("tracks")}
                                    className="px-5 py-2 rounded-xl text-xs font-bold transition-all"
                                    style={tab === "tracks"
                                        ? { background: "var(--accent)", color: "#fff", boxShadow: "0 2px 10px var(--accent-glow)" }
                                        : { color: "var(--text-muted)", background: "transparent" }}
                                >Tracks</button>
                            )}
                            <button
                                onClick={() => setTab("playlists")}
                                className="px-5 py-2 rounded-xl text-xs font-bold transition-all"
                                style={tab === "playlists"
                                    ? { background: "var(--accent)", color: "#fff", boxShadow: "0 2px 10px var(--accent-glow)" }
                                    : { color: "var(--text-muted)", background: "transparent" }}
                            >Playlists</button>
                        </div>
                    </div>

                    {/* ── Playlists tab: bento hero ── */}
                    {tab === "playlists" && !loading && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            {/* Hero card */}
                            <div
                                className="md:col-span-2 rounded-2xl p-6 md:p-8 flex flex-col justify-between relative overflow-hidden"
                                style={{
                                    background: isDark
                                        ? "rgba(20,20,35,0.85)"
                                        : "rgba(255,255,255,0.80)",
                                    border: "1px solid var(--glass-border)",
                                    backdropFilter: "blur(40px)",
                                    minHeight: 180,
                                }}
                            >
                                {/* Ambient glow */}
                                <div
                                    className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none"
                                    style={{ background: "rgba(41,151,255,0.10)", filter: "blur(60px)" }}
                                />
                                <div className="relative">
                                    <span
                                        className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4"
                                        style={{
                                            background: isDark ? "rgba(233,179,255,0.15)" : "rgba(191,90,242,0.10)",
                                            color: "#e9b3ff",
                                            border: "1px solid rgba(233,179,255,0.25)",
                                        }}
                                    >
                                        Studio Status
                                    </span>
                                    <h3 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                                        Build Your Presence
                                    </h3>
                                    <p className="text-sm max-w-sm" style={{ color: "var(--text-secondary)" }}>
                                        Create playlists that tell a story. Organize your tracks to engage your listeners more effectively.
                                    </p>
                                </div>
                                <div className="relative mt-6">
                                    {showCreatePlaylist ? (
                                        <form onSubmit={handleCreatePlaylist} className="flex gap-2 items-center slide-up">
                                            <input
                                                type="text"
                                                placeholder="Playlist name..."
                                                value={newPlaylistTitle}
                                                onChange={(e) => setNewPlaylistTitle(e.target.value)}
                                                className="glass-input flex-1 p-2.5 text-sm"
                                                autoFocus required
                                            />
                                            <button type="submit" disabled={creating || !newPlaylistTitle.trim()} className="btn-sm btn-sm-accent">
                                                {creating ? "..." : "Create"}
                                            </button>
                                            <button type="button" onClick={() => { setShowCreatePlaylist(false); setNewPlaylistTitle(""); }} className="btn-sm">✕</button>
                                        </form>
                                    ) : (
                                        <button
                                            onClick={() => setShowCreatePlaylist(true)}
                                            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-black text-sm transition-all active:scale-95"
                                            style={{
                                                background: "linear-gradient(135deg, var(--accent) 0%, #bf5af2 100%)",
                                                color: "#fff",
                                                boxShadow: "0 4px 18px rgba(41,151,255,0.35)",
                                                border: "none", cursor: "pointer",
                                            }}
                                        >
                                            ＋ NEW PLAYLIST →
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Stats card */}
                            <div
                                className="rounded-2xl p-6 flex flex-col items-center justify-center text-center"
                                style={{
                                    background: isDark ? "rgba(20,20,35,0.85)" : "rgba(255,255,255,0.80)",
                                    border: "1px solid var(--glass-border)",
                                    backdropFilter: "blur(40px)",
                                }}
                            >
                                <div
                                    className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
                                    style={{
                                        background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                                        border: "1px solid var(--glass-border)",
                                        fontSize: 28,
                                    }}
                                >
                                    🎶
                                </div>
                                <h4 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>
                                    {playlists.length}
                                </h4>
                                <p className="text-xs font-bold mt-1 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                                    {playlists.length === 1 ? "Playlist" : "Playlists"}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Content */}
                    {loading ? (
                        <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>
                            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3"
                                style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
                            Loading...
                        </div>
                    ) : tab === "tracks" ? (
                        <>
                            <div className="space-y-2">
                                {tracks.map((t) => (
                                    <div key={t.id} className="glass-card !rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 fade-in">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm truncate">{t.title}</p>
                                            <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                                                {t.artist}{t.album ? ` • ${t.album}` : ""}{t.genre ? ` • ${t.genre}` : ""} • {formatDuration(t.duration)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <Link href={`/tracks/${t.id}`} className="btn-sm" style={{ textDecoration: "none" }}>Edit</Link>
                                            <button onClick={() => setDeleteTarget({ type: "track", item: t })} className="btn-sm btn-sm-danger">Delete</button>
                                        </div>
                                    </div>
                                ))}
                                {tracks.length === 0 && (
                                    <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>
                                        <p className="text-4xl mb-3">🎵</p>
                                        <p className="text-sm">No tracks yet. Upload one below!</p>
                                    </div>
                                )}
                            </div>
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 py-6">
                                    <button className="pagination-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>‹</button>
                                    <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{page} / {totalPages}</span>
                                    <button className="pagination-btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>›</button>
                                </div>
                            )}
                        </>
                    ) : (
                        /* Playlists tab — managed playlists section */
                        <section>
                            <div className="flex items-center justify-between mb-4 px-1">
                                <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                                    <span className="w-1.5 h-5 rounded-full flex-shrink-0" style={{ background: "var(--accent)" }} />
                                    Managed Playlists
                                </h3>
                            </div>

                            <div className="space-y-3">
                                {playlists.map((pl) => (
                                    <div
                                        key={pl.id}
                                        className="glass-card !rounded-2xl p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4 fade-in group"
                                    >
                                        {/* Icon */}
                                        <div
                                            className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl"
                                            style={{
                                                background: "linear-gradient(135deg, var(--accent) 0%, #bf5af2 100%)",
                                            }}
                                        >
                                            🎵
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                                                    {pl.title}
                                                </h4>
                                                <span className="text-[10px] font-bold uppercase" style={{ color: "var(--accent)" }}>
                                                    {pl.track_ids?.length || 0} Tracks
                                                </span>
                                            </div>
                                            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                                                Public playlist
                                            </p>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <Link
                                                href={`/playlists/${pl.id}`}
                                                className="flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold transition-all active:scale-95"
                                                style={{
                                                    background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                                                    border: "1px solid var(--glass-border)",
                                                    color: "var(--text-primary)",
                                                    textDecoration: "none",
                                                }}
                                            >
                                                ✏️ Edit
                                            </Link>
                                            <button
                                                onClick={() => setDeleteTarget({ type: "playlist", item: pl })}
                                                className="flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold transition-all active:scale-95"
                                                style={{
                                                    background: isDark ? "rgba(255,59,48,0.10)" : "rgba(255,59,48,0.07)",
                                                    border: "1px solid rgba(255,59,48,0.20)",
                                                    color: "#ff3b30",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                🗑️ Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {/* "Add another playlist" dashed card */}
                                <button
                                    onClick={() => setShowCreatePlaylist(true)}
                                    className="w-full rounded-2xl p-6 flex flex-col items-center justify-center gap-2 transition-all group"
                                    style={{
                                        border: `2px dashed ${isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)"}`,
                                        background: "transparent",
                                        cursor: "pointer",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = "rgba(41,151,255,0.35)";
                                        e.currentTarget.style.background = isDark ? "rgba(41,151,255,0.05)" : "rgba(41,151,255,0.03)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)";
                                        e.currentTarget.style.background = "transparent";
                                    }}
                                >
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center mb-1"
                                        style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)" }}
                                    >
                                        <span style={{ fontSize: 18 }}>＋</span>
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                                        Add another playlist
                                    </span>
                                </button>

                                {playlists.length === 0 && (
                                    <p className="text-center text-sm py-4" style={{ color: "var(--text-muted)" }}>
                                        No playlists yet. Create your first one above!
                                    </p>
                                )}
                            </div>
                        </section>
                    )}
                </div>
            </div>

            {tab === "tracks" && user?.role !== "user" && (
                <UploadTrack onUploadSuccess={() => setRefetchKey((k) => k + 1)} />
            )}

            {deleteTarget && (
                <ConfirmModal
                    icon="🗑️"
                    title={deleteTarget.type === "track" ? "Delete Track" : "Delete Playlist"}
                    message={`Are you sure you want to delete "${deleteTarget.type === "track" ? (deleteTarget.item as Track).title : (deleteTarget.item as Playlist).title}"? This action cannot be undone.`}
                    confirmLabel="Delete"
                    danger
                    loading={deleting}
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}
        </div>
    );
}
