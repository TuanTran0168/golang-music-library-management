"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Navbar } from "@/components/layout";
import { ConfirmModal } from "@/components/common";
import { TrackPickerModal } from "@/components/track";
import { fetchPlaylistById, fetchTracksFromPlaylist, updatePlaylist, deletePlaylist } from "@/lib/api";
import { Playlist, Track } from "@/types/music";
import { isLoggedIn } from "@/lib/auth";

const formatDuration = (s: number) => {
    if (isNaN(s) || s < 0) return "0:00";
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
};

export default function PlaylistDetailPage() {
    return (
        <div className="flex flex-col h-screen">
            <Navbar />
            <PlaylistEditor />
        </div>
    );
}

function PlaylistEditor() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const loggedIn = isLoggedIn();

    const [playlist, setPlaylist] = useState<Playlist | null>(null);
    const [tracks, setTracks] = useState<Track[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const [editTitle, setEditTitle] = useState("");
    const [editing, setEditing] = useState(false);

    // Delete modals
    const [showDeletePlaylist, setShowDeletePlaylist] = useState(false);
    const [deletingPlaylist, setDeletingPlaylist] = useState(false);
    const [removeTrackTarget, setRemoveTrackTarget] = useState<Track | null>(null);
    const [removingTrack, setRemovingTrack] = useState(false);

    // Add tracks modal
    const [showTrackPicker, setShowTrackPicker] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const pl = await fetchPlaylistById(id);
                setPlaylist(pl);
                setEditTitle(pl.title);
                const t = await fetchTracksFromPlaylist(pl);
                setTracks(t);
            } catch {
                setError("Playlist not found");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    const handleSaveTitle = async () => {
        if (!editTitle.trim()) return;
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append("title", editTitle);
            const updated = await updatePlaylist(id, fd);
            setPlaylist(updated);
            setEditing(false);
            toast.success(`Updated playlist "${editTitle}"`);
        } catch {
            toast.error(`Failed to update playlist "${editTitle}"`);
        } finally {
            setSaving(false);
        }
    };

    const handleConfirmRemoveTrack = async () => {
        if (!playlist || !removeTrackTarget) return;
        setRemovingTrack(true);
        const newIds = playlist.track_ids.filter((tid) => tid !== removeTrackTarget.id);
        const fd = new FormData();
        fd.append("mode", "overwrite");
        newIds.forEach((tid) => fd.append("track_ids", tid));
        try {
            const updated = await updatePlaylist(id, fd);
            setPlaylist(updated);
            setTracks((prev) => prev.filter((t) => t.id !== removeTrackTarget.id));
            toast.success(`Removed "${removeTrackTarget.title}" from playlist "${playlist.title}"`);
            setRemoveTrackTarget(null);
        } catch {
            toast.error(`Failed to remove "${removeTrackTarget.title}"`);
        } finally {
            setRemovingTrack(false);
        }
    };

    const handleConfirmDeletePlaylist = async () => {
        setDeletingPlaylist(true);
        const name = playlist?.title || "playlist";
        try {
            await deletePlaylist(id);
            toast.success(`Deleted playlist "${name}"`);
            router.push("/");
        } catch {
            toast.error(`Failed to delete playlist "${name}"`);
        } finally {
            setDeletingPlaylist(false);
        }
    };

    const handleTracksAdded = async () => {
        setShowTrackPicker(false);
        // Reload playlist data
        const pl = await fetchPlaylistById(id);
        setPlaylist(pl);
        const t = await fetchTracksFromPlaylist(pl);
        setTracks(t);
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center" style={{ color: "var(--text-muted)" }}>
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !playlist) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="glass rounded-2xl p-10 text-center">
                    <p className="text-4xl mb-3">❌</p>
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{error || "Playlist not found"}</p>
                    <Link href="/" className="btn-accent inline-block mt-4 text-sm !py-2 !px-5">Back to Home</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-auto p-4 md:p-8">
            <div className="max-w-2xl mx-auto">
                <Link href="/" className="text-sm mb-4 inline-flex items-center gap-1 hover:text-white transition" style={{ color: "var(--text-secondary)" }}>
                    ← Back to Home
                </Link>

                {/* Playlist header */}
                <div className="glass rounded-2xl p-6 mb-6 slide-up">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            {editing ? (
                                <div className="flex gap-2">
                                    <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="glass-input flex-1 p-2 text-sm" />
                                    <button onClick={handleSaveTitle} disabled={saving} className="btn-accent text-xs !py-2 !px-4">{saving ? "..." : "Save"}</button>
                                    <button onClick={() => { setEditing(false); setEditTitle(playlist.title); }} className="btn-glass text-xs !py-2 !px-3">✕</button>
                                </div>
                            ) : (
                                <h1 className="text-xl md:text-2xl font-bold text-gradient">🎶 {playlist.title}</h1>
                            )}
                            <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                                {tracks.length} track{tracks.length !== 1 ? "s" : ""}
                            </p>
                        </div>

                        {loggedIn && !editing && (
                            <div className="flex gap-2 flex-shrink-0">
                                <button onClick={() => setEditing(true)} className="btn-glass text-xs !py-1.5 !px-3">✏️ Edit</button>
                                <button onClick={() => setShowDeletePlaylist(true)} className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition">🗑️</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Track list header */}
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Tracks</h2>
                    {loggedIn && (
                        <button onClick={() => setShowTrackPicker(true)} className="btn-accent text-xs !py-1.5 !px-4">
                            ＋ Add Tracks
                        </button>
                    )}
                </div>
                <div className="space-y-2">
                    {tracks.map((t, i) => (
                        <div key={t.id} className="glass-card !rounded-xl p-3 flex items-center gap-3 group fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                            <span className="text-xs w-6 text-center" style={{ color: "var(--text-muted)" }}>
                                {(i + 1).toString().padStart(2, "0")}
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{t.title}</p>
                                <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                                    {t.artist} • {formatDuration(t.duration)}
                                </p>
                            </div>
                            {loggedIn && (
                                <button
                                    onClick={() => setRemoveTrackTarget(t)}
                                    className="text-xs px-2 py-1 rounded-lg text-red-400 hover:bg-red-500/10 transition opacity-0 group-hover:opacity-100"
                                    title="Remove from playlist"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    ))}
                    {tracks.length === 0 && (
                        <div className="text-center py-8" style={{ color: "var(--text-muted)" }}>
                            <p className="text-sm">This playlist is empty</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Playlist Modal */}
            {showDeletePlaylist && (
                <ConfirmModal
                    icon="🗑️"
                    title="Delete Playlist"
                    message={`Are you sure you want to delete "${playlist.title}"? This action cannot be undone.`}
                    confirmLabel="Delete"
                    danger
                    loading={deletingPlaylist}
                    onConfirm={handleConfirmDeletePlaylist}
                    onCancel={() => setShowDeletePlaylist(false)}
                />
            )}

            {/* Remove Track from Playlist Modal */}
            {removeTrackTarget && (
                <ConfirmModal
                    icon="🎵"
                    title="Remove Track"
                    message={`Remove "${removeTrackTarget.title}" from "${playlist.title}"?`}
                    confirmLabel="Remove"
                    danger
                    loading={removingTrack}
                    onConfirm={handleConfirmRemoveTrack}
                    onCancel={() => setRemoveTrackTarget(null)}
                />
            )}

            {/* Add Tracks Picker Modal */}
            {showTrackPicker && playlist && (
                <TrackPickerModal
                    playlistId={playlist.id}
                    playlistTitle={playlist.title}
                    existingTrackIds={playlist.track_ids || []}
                    onSuccess={handleTracksAdded}
                    onClose={() => setShowTrackPicker(false)}
                />
            )}
        </div>
    );
}
