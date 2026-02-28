"use client";

import React, { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { Playlist } from "@/types/music";
import { fetchPlaylists, createPlaylist, updatePlaylistTracks } from "@/lib/api";

interface Props {
  selectedTrackIds: string[];
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PlaylistActionModal({ selectedTrackIds, onSuccess, onCancel }: Props) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<"create" | "update">("create");
  const [newPlaylistTitle, setNewPlaylistTitle] = useState("");
  const [selectedPlaylistId, setSelectedPlaylistId] = useState("");
  const [updateMode, setUpdateMode] = useState<"append" | "overwrite">("append");

  useEffect(() => {
    fetchPlaylists(1, 100, true).then(setPlaylists).finally(() => setLoading(false));
  }, []);

  const tracksCount = selectedTrackIds.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (mode === "create") {
        if (!newPlaylistTitle.trim()) return;
        const fd = new FormData();
        fd.append("title", newPlaylistTitle);
        selectedTrackIds.forEach((id) => fd.append("track_ids", id));
        await createPlaylist(fd);
        toast.success(`Playlist "${newPlaylistTitle}" created!`);
      } else {
        if (!selectedPlaylistId) return;
        const fd = new FormData();
        fd.append("mode", updateMode);
        selectedTrackIds.forEach((id) => fd.append("track_ids", id));
        await updatePlaylistTracks(selectedPlaylistId, fd);
        const name = playlists.find((p) => p.id === selectedPlaylistId)?.title || "Playlist";
        toast.success(`${tracksCount} track(s) added to "${name}"`);
      }
      onSuccess();
    } catch {
      toast.error("Operation failed!");
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = useMemo(() => {
    if (mode === "create") return newPlaylistTitle.trim().length > 0;
    if (mode === "update") return selectedPlaylistId.length > 0;
    return false;
  }, [mode, newPlaylistTitle, selectedPlaylistId]);

  if (loading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />

      <div className="glass rounded-2xl p-6 w-full max-w-md relative slide-up">
        <h3 className="text-2xl font-bold text-gradient mb-2">Playlist Action</h3>
        <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
          <span className="font-bold text-purple-400">{tracksCount}</span> track(s) selected
        </p>

        <div className="flex gap-2 mb-5 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.05)" }}>
          <button
            type="button"
            onClick={() => setMode("create")}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${mode === "create" ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" : "text-gray-400 hover:text-white"
              }`}
          >
            Create New
          </button>
          <button
            type="button"
            onClick={() => setMode("update")}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${mode === "update" ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" : "text-gray-400 hover:text-white"
              }`}
          >
            Add to Existing
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "create" && (
            <input type="text" placeholder="Playlist name..." value={newPlaylistTitle} onChange={(e) => setNewPlaylistTitle(e.target.value)} className="glass-input w-full p-3 text-sm" required />
          )}

          {mode === "update" && (
            <div className="space-y-3">
              {/* Custom playlist selector */}
              <div>
                <p className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Select a playlist</p>
                <div className="max-h-48 overflow-y-auto rounded-xl border border-white/10" style={{ background: "rgba(255,255,255,0.03)" }}>
                  {playlists.length === 0 ? (
                    <p className="text-xs text-center py-4" style={{ color: "var(--text-muted)" }}>No playlists available</p>
                  ) : (
                    playlists.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPlaylistId(p.id)}
                        className={`w-full text-left px-4 py-3 text-sm transition flex items-center justify-between border-b border-white/5 last:border-0 ${selectedPlaylistId === p.id
                          ? "bg-purple-500/20 text-white"
                          : "text-gray-300 hover:bg-white/5"
                          }`}
                      >
                        <span className="truncate">🎶 {p.title}</span>
                        {selectedPlaylistId === p.id && (
                          <span className="text-purple-400 flex-shrink-0 ml-2">✓</span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="mode" value="append" checked={updateMode === "append"} onChange={() => setUpdateMode("append")} className="accent-purple-500" />
                  Append
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="mode" value="overwrite" checked={updateMode === "overwrite"} onChange={() => setUpdateMode("overwrite")} className="accent-purple-500" />
                  Overwrite
                </label>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
            <button type="button" onClick={onCancel} disabled={submitting} className="btn-glass text-sm">Cancel</button>
            <button type="submit" disabled={submitting || !isFormValid || tracksCount === 0} className="btn-accent text-sm">
              {submitting ? "Processing..." : "Confirm"}
            </button>
          </div>
        </form>

        <button onClick={onCancel} className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition text-sm">✕</button>
      </div>
    </div>
  );
}