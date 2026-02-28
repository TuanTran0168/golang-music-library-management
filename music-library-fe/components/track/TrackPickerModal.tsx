"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { fetchTracks, searchTracks, updatePlaylist, DEFAULT_PAGE_SIZE } from "@/lib/api";
import { Track, Paginated } from "@/types/music";

interface Props {
    playlistId: string;
    playlistTitle: string;
    existingTrackIds: string[];
    onSuccess: (addedCount: number) => void;
    onClose: () => void;
}

export default function TrackPickerModal({ playlistId, playlistTitle, existingTrackIds, onSuccess, onClose }: Props) {
    const [tracks, setTracks] = useState<Track[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [submitting, setSubmitting] = useState(false);

    const totalPages = Math.max(1, Math.ceil(totalCount / DEFAULT_PAGE_SIZE));

    useEffect(() => {
        setLoading(true);
        const fetchFn = query.trim()
            ? searchTracks(query, page, DEFAULT_PAGE_SIZE)
            : fetchTracks(page, DEFAULT_PAGE_SIZE);

        fetchFn
            .then((res: Paginated<Track>) => {
                setTracks(res.data || []);
                setTotalCount(res.total_count || 0);
            })
            .finally(() => setLoading(false));
    }, [page, query]);

    // Debounce search
    const [searchInput, setSearchInput] = useState("");
    useEffect(() => {
        const t = setTimeout(() => { setQuery(searchInput); setPage(1); }, 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    const toggleTrack = (id: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleAdd = async () => {
        if (selected.size === 0) return;
        setSubmitting(true);
        try {
            const fd = new FormData();
            fd.append("mode", "append");
            selected.forEach((id) => fd.append("track_ids", id));
            await updatePlaylist(playlistId, fd);
            toast.success(`Added ${selected.size} track(s) to "${playlistTitle}"`);
            onSuccess(selected.size);
        } catch {
            toast.error("Failed to add tracks");
        } finally {
            setSubmitting(false);
        }
    };

    const formatDuration = (s: number) => {
        if (isNaN(s) || s < 0) return "0:00";
        return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
    };

    const alreadyInPlaylist = new Set(existingTrackIds);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !submitting && onClose()} />

            <div className="glass rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col relative slide-up">
                {/* Header */}
                <div className="p-5 border-b border-white/10 flex-shrink-0">
                    <h3 className="text-xl font-bold text-gradient mb-1">Add Tracks</h3>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        Select tracks to add to &ldquo;{playlistTitle}&rdquo;
                        {selected.size > 0 && (
                            <span className="ml-2 text-purple-400 font-semibold">• {selected.size} selected</span>
                        )}
                    </p>
                    <input
                        type="text"
                        placeholder="Search tracks..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="glass-input w-full p-2.5 text-sm mt-3"
                    />
                    <button
                        onClick={() => !submitting && onClose()}
                        className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition text-sm"
                    >
                        ✕
                    </button>
                </div>

                {/* Track list */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="text-center py-8" style={{ color: "var(--text-muted)" }}>
                            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                            <p className="text-xs">Loading tracks...</p>
                        </div>
                    ) : tracks.length === 0 ? (
                        <div className="text-center py-8" style={{ color: "var(--text-muted)" }}>
                            <p className="text-sm">No tracks found</p>
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            {tracks.map((t) => {
                                const isExisting = alreadyInPlaylist.has(t.id);
                                const isSelected = selected.has(t.id);

                                return (
                                    <button
                                        key={t.id}
                                        onClick={() => !isExisting && toggleTrack(t.id)}
                                        disabled={isExisting}
                                        className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition ${isExisting
                                                ? "opacity-40 cursor-not-allowed"
                                                : isSelected
                                                    ? "bg-purple-500/20 border border-purple-500/40"
                                                    : "hover:bg-white/5"
                                            }`}
                                    >
                                        {/* Checkbox */}
                                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition ${isExisting
                                                ? "border-gray-600 bg-gray-700"
                                                : isSelected
                                                    ? "border-purple-500 bg-purple-500"
                                                    : "border-white/20"
                                            }`}>
                                            {(isSelected || isExisting) && (
                                                <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{t.title}</p>
                                            <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                                                {t.artist} • {formatDuration(t.duration)}
                                                {isExisting && " • Already in playlist"}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 flex-shrink-0 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {totalPages > 1 && (
                            <>
                                <button className="pagination-btn !px-2 !py-1 text-xs" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>‹</button>
                                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{page}/{totalPages}</span>
                                <button className="pagination-btn !px-2 !py-1 text-xs" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>›</button>
                            </>
                        )}
                    </div>

                    <button
                        onClick={handleAdd}
                        disabled={submitting || selected.size === 0}
                        className="btn-accent text-sm !py-2 !px-5"
                    >
                        {submitting ? "Adding..." : `Add ${selected.size || ""} Track${selected.size !== 1 ? "s" : ""}`}
                    </button>
                </div>
            </div>
        </div>
    );
}
