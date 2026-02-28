"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Navbar } from "@/components/layout";
import { RoleGuard } from "@/components/auth";
import { UploadTrack } from "@/components/track";
import { ConfirmModal } from "@/components/common";
import { fetchTracks, deleteTrack, fetchPlaylists, createPlaylist, deletePlaylist, DEFAULT_PAGE_SIZE } from "@/lib/api";
import { Track, Playlist, Paginated } from "@/types/music";

const formatDuration = (s: number) => {
    if (isNaN(s) || s < 0) return "0:00";
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
};

export default function ArtistPage() {
    return (
        <div className="flex flex-col h-screen">
            <Navbar />
            <RoleGuard roles={["admin", "artist"]}>
                <ArtistDashboard />
            </RoleGuard>
        </div>
    );
}

function ArtistDashboard() {
    const [tab, setTab] = useState<"tracks" | "playlists">("tracks");
    const [tracks, setTracks] = useState<Track[]>([]);
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [refetchKey, setRefetchKey] = useState(0);

    // Create playlist
    const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
    const [newPlaylistTitle, setNewPlaylistTitle] = useState("");
    const [creating, setCreating] = useState(false);

    // Delete confirm modal
    const [deleteTarget, setDeleteTarget] = useState<{ type: "track"; item: Track } | { type: "playlist"; item: Playlist } | null>(null);
    const [deleting, setDeleting] = useState(false);

    const totalPages = Math.max(1, Math.ceil(totalCount / DEFAULT_PAGE_SIZE));

    useEffect(() => {
        setLoading(true);
        if (tab === "tracks") {
            fetchTracks(page, DEFAULT_PAGE_SIZE, true)
                .then((res: Paginated<Track>) => {
                    setTracks(res.data || []);
                    setTotalCount(res.total_count || 0);
                })
                .finally(() => setLoading(false));
        } else {
            fetchPlaylists()
                .then((pls) => {
                    setPlaylists(pls);
                    setTotalCount(pls.length);
                })
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
                toast.success(`Deleted track "${(deleteTarget.item as Track).title}"`);
            } else {
                await deletePlaylist(deleteTarget.item.id);
                toast.success(`Deleted playlist "${(deleteTarget.item as Playlist).title}"`);
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
            toast.success(`Created playlist "${newPlaylistTitle}"`);
            setNewPlaylistTitle("");
            setShowCreatePlaylist(false);
            setRefetchKey((k) => k + 1);
        } catch {
            toast.error("Failed to create playlist");
        } finally {
            setCreating(false);
        }
    };

    const deleteModalTitle = deleteTarget?.type === "track" ? "Delete Track" : "Delete Playlist";
    const deleteModalName = deleteTarget?.type === "track" ? (deleteTarget.item as Track).title : (deleteTarget?.item as Playlist)?.title;

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-auto p-4 md:p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gradient">Artist Studio</h1>
                            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                                Manage your music ({totalCount} {tab})
                            </p>
                        </div>
                        <Link href="/" className="btn-glass text-sm !py-2 !px-4">← Back to Home</Link>
                    </div>

                    {/* Tab Toggle */}
                    <div className="flex gap-2 mb-6 p-1 rounded-xl max-w-xs" style={{ background: "rgba(255,255,255,0.05)" }}>
                        <button onClick={() => setTab("tracks")} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${tab === "tracks" ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow" : "text-gray-400 hover:text-white"}`}>
                            🎵 Tracks
                        </button>
                        <button onClick={() => setTab("playlists")} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${tab === "playlists" ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow" : "text-gray-400 hover:text-white"}`}>
                            🎶 Playlists
                        </button>
                    </div>

                    {loading ? (
                        <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>
                            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
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
                                                {t.artist} {t.album ? `• ${t.album}` : ""} {t.genre ? `• ${t.genre}` : ""} • {formatDuration(t.duration)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <Link href={`/tracks/${t.id}`} className="btn-glass text-xs !py-1.5 !px-3">✏️ Edit</Link>
                                            <button onClick={() => setDeleteTarget({ type: "track", item: t })} className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition">🗑️ Delete</button>
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
                        <>
                            <div className="mb-4">
                                {showCreatePlaylist ? (
                                    <form onSubmit={handleCreatePlaylist} className="glass rounded-xl p-4 flex gap-3 items-center slide-up">
                                        <input type="text" placeholder="Playlist name..." value={newPlaylistTitle} onChange={(e) => setNewPlaylistTitle(e.target.value)} className="glass-input flex-1 p-2.5 text-sm" autoFocus required />
                                        <button type="submit" disabled={creating || !newPlaylistTitle.trim()} className="btn-accent text-sm !py-2 !px-4">{creating ? "Creating..." : "Create"}</button>
                                        <button type="button" onClick={() => { setShowCreatePlaylist(false); setNewPlaylistTitle(""); }} className="btn-glass text-sm !py-2 !px-3">✕</button>
                                    </form>
                                ) : (
                                    <button onClick={() => setShowCreatePlaylist(true)} className="btn-accent text-sm !py-2 !px-5">＋ New Playlist</button>
                                )}
                            </div>
                            <div className="space-y-2">
                                {playlists.map((pl) => (
                                    <div key={pl.id} className="glass-card !rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 fade-in">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm truncate">🎶 {pl.title}</p>
                                            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{pl.track_ids?.length || 0} tracks</p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <Link href={`/playlists/${pl.id}`} className="btn-glass text-xs !py-1.5 !px-3">✏️ Edit</Link>
                                            <button onClick={() => setDeleteTarget({ type: "playlist", item: pl })} className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition">🗑️ Delete</button>
                                        </div>
                                    </div>
                                ))}
                                {playlists.length === 0 && (
                                    <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>
                                        <p className="text-4xl mb-3">🎶</p>
                                        <p className="text-sm">No playlists yet. Create one above!</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {tab === "tracks" && <UploadTrack onUploadSuccess={() => setRefetchKey((k) => k + 1)} />}

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <ConfirmModal
                    icon="🗑️"
                    title={deleteModalTitle}
                    message={`Are you sure you want to delete "${deleteModalName}"? This action cannot be undone.`}
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
