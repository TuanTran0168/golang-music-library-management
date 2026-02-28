"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";
import { Navbar } from "@/components/layout";
import { RoleGuard } from "@/components/auth";
import { ConfirmModal } from "@/components/common";
import { fetchTrackById, updateTrack, deleteTrack } from "@/lib/api";
import { Track } from "@/types/music";
import { getUser } from "@/lib/auth";

export default function TrackDetailPage() {
    return (
        <div className="flex flex-col h-screen">
            <Navbar />
            <RoleGuard roles={["admin", "artist"]}>
                <TrackEditor />
            </RoleGuard>
        </div>
    );
}

function TrackEditor() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const user = getUser();

    const [track, setTrack] = useState<Track | null>(null);
    const isOwnerOrAdmin = user?.role === "admin" || String(user?.id) === String(track?.user_id);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [title, setTitle] = useState("");
    const [artist, setArtist] = useState("");
    const [album, setAlbum] = useState("");
    const [genre, setGenre] = useState("");
    const [releaseYear, setReleaseYear] = useState<number | "">("");

    useEffect(() => {
        fetchTrackById(id)
            .then((t) => {
                setTrack(t);
                setTitle(t.title);
                setArtist(t.artist);
                setAlbum(t.album || "");
                setGenre(t.genre || "");
                setReleaseYear(t.release_year || "");
            })
            .catch(() => setError("Track not found"))
            .finally(() => setLoading(false));
    }, [id]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const updated = await updateTrack(id, {
                title, artist, album, genre,
                release_year: releaseYear ? Number(releaseYear) : undefined,
            });
            setTrack(updated);
            toast.success(`Updated track "${title}"`);
        } catch {
            toast.error(`Failed to update track "${title}"`);
        } finally {
            setSaving(false);
        }
    };

    const handleConfirmDelete = async () => {
        setDeleting(true);
        try {
            const name = track?.title || "track";
            await deleteTrack(id);
            toast.success(`Deleted track "${name}"`);
            router.push("/artist");
        } catch {
            toast.error(`Failed to delete track "${track?.title}"`);
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center" style={{ color: "var(--text-muted)" }}>
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !track) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="glass rounded-2xl p-10 text-center">
                    <p className="text-4xl mb-3">❌</p>
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{error || "Track not found"}</p>
                    <Link href="/artist" className="btn-accent inline-block mt-4 text-sm !py-2 !px-5">Back to Studio</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-auto p-4 md:p-8">
            <div className="max-w-lg mx-auto">
                <Link href="/artist" className="text-sm mb-4 inline-flex items-center gap-1 hover:text-white transition" style={{ color: "var(--text-secondary)" }}>
                    ← Back to Studio
                </Link>

                <div className="glass rounded-2xl p-6 md:p-8 slide-up">
                    <h1 className="text-xl md:text-2xl font-bold text-gradient mb-6">Edit Track</h1>

                    <form onSubmit={handleSave} className="space-y-4">
                        <div>
                            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-muted)" }}>Title</label>
                            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="glass-input w-full p-3 text-sm" required />
                        </div>
                        <div>
                            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-muted)" }}>Artist</label>
                            <input type="text" value={artist} onChange={(e) => setArtist(e.target.value)} className="glass-input w-full p-3 text-sm" required />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-muted)" }}>Album</label>
                                <input type="text" value={album} onChange={(e) => setAlbum(e.target.value)} className="glass-input w-full p-3 text-sm" />
                            </div>
                            <div>
                                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-muted)" }}>Genre</label>
                                <input type="text" value={genre} onChange={(e) => setGenre(e.target.value)} className="glass-input w-full p-3 text-sm" />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-muted)" }}>Release Year</label>
                            <input type="number" min="1900" max={new Date().getFullYear()} value={releaseYear} onChange={(e) => setReleaseYear(e.target.value ? parseInt(e.target.value) : "")} className="glass-input w-full p-3 text-sm" />
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                            <button
                                type="button"
                                onClick={() => isOwnerOrAdmin && setShowDeleteModal(true)}
                                disabled={!isOwnerOrAdmin}
                                className={`text-sm px-4 py-2 rounded-lg transition ${isOwnerOrAdmin ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" : "bg-gray-500/10 text-gray-500 opacity-50 cursor-not-allowed"}`}
                                title={!isOwnerOrAdmin ? "No permission to delete" : "Delete Track"}
                            >
                                🗑️ Delete Track
                            </button>
                            <button
                                type="submit"
                                disabled={saving || !isOwnerOrAdmin}
                                className={`text-sm !py-2 !px-6 transition ${isOwnerOrAdmin ? "btn-accent" : "bg-gray-500/10 text-gray-400 opacity-50 cursor-not-allowed rounded-lg"}`}
                                title={!isOwnerOrAdmin ? "No permission to edit" : "Save Changes"}
                            >
                                {saving ? "Saving..." : "💾 Save Changes"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {showDeleteModal && (
                <ConfirmModal
                    icon="🗑️"
                    title="Delete Track"
                    message={`Are you sure you want to delete "${track.title}"? This action cannot be undone.`}
                    confirmLabel="Delete"
                    danger
                    loading={deleting}
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setShowDeleteModal(false)}
                />
            )}
        </div>
    );
}
