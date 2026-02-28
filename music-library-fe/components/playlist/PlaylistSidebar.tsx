"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Playlist } from "@/types/music";
import { fetchPlaylists, deletePlaylist } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { ConfirmModal } from "@/components/common";

interface Props {
  onSelect: (playlist: Playlist | null) => void;
  activeView: "all" | string;
  setActiveView: (view: "all" | string) => void;
  refetchKey: number;
  refetchPlaylists: () => void;
  canManage: boolean;
}

export default function PlaylistSidebar({
  onSelect,
  activeView,
  setActiveView,
  refetchKey,
  refetchPlaylists,
  canManage,
}: Props) {
  const user = getUser();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Playlist | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchPlaylists()
      .then(setPlaylists)
      .finally(() => setLoading(false));
  }, [refetchKey]);

  const handleSelect = (playlist: Playlist | null) => {
    onSelect(playlist);
    setActiveView(playlist ? playlist.id : "all");
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePlaylist(deleteTarget.id);
      toast.success(`Deleted playlist "${deleteTarget.title}"`);
      if (activeView === deleteTarget.id) handleSelect(null);
      setDeleteTarget(null);
      refetchPlaylists();
    } catch {
      toast.error(`Failed to delete playlist "${deleteTarget?.title}"`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <aside className="glass w-64 md:w-72 flex-shrink-0 flex flex-col h-full border-r border-white/10">
      <div className="p-4 flex-1 overflow-y-auto">
        <p className="text-[10px] uppercase font-bold tracking-widest mb-3 px-2" style={{ color: "var(--text-muted)" }}>
          Browse
        </p>
        <button
          className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-1 ${activeView === "all"
            ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border border-purple-500/30"
            : "text-gray-300 hover:bg-white/5"
            }`}
          onClick={() => handleSelect(null)}
        >
          🎧 All Tracks
        </button>

        <p className="text-[10px] uppercase font-bold tracking-widest mt-6 mb-3 px-2" style={{ color: "var(--text-muted)" }}>
          Playlists
        </p>

        {loading ? (
          <div className="px-3 py-2 text-xs" style={{ color: "var(--text-muted)" }}>Loading...</div>
        ) : (
          <ul className="space-y-1">
            {playlists.map((pl) => (
              <li
                key={pl.id}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all text-sm ${activeView === pl.id
                  ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border border-purple-500/30"
                  : "text-gray-300 hover:bg-white/5"
                  }`}
                onClick={() => handleSelect(pl)}
              >
                <Link href={`/playlists/${pl.id}`} onClick={(e) => e.stopPropagation()} className="truncate font-medium hover:text-purple-300 transition">
                  🎶 {pl.title}
                </Link>
                {canManage && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (user?.role === "admin" || user?.id === pl.user_id) setDeleteTarget(pl);
                    }}
                    disabled={!(user?.role === "admin" || user?.id === pl.user_id)}
                    className={`p-1 rounded-lg flex-shrink-0 transition ${user?.role === "admin" || user?.id === pl.user_id
                        ? "text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 hover:bg-red-500/10"
                        : "text-gray-500 opacity-30 cursor-not-allowed group-hover:opacity-30"
                      }`}
                    title={!(user?.role === "admin" || user?.id === pl.user_id) ? "No permission to delete" : "Delete playlist"}
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 10-2 0v6a1 1 0 102 0V8z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </li>
            ))}
            {playlists.length === 0 && !loading && (
              <li className="px-3 py-2 text-xs" style={{ color: "var(--text-muted)" }}>No playlists yet</li>
            )}
          </ul>
        )}
      </div>

      {/* Delete Playlist Modal */}
      {deleteTarget && (
        <ConfirmModal
          icon="🗑️"
          title="Delete Playlist"
          message={`Are you sure you want to delete "${deleteTarget.title}"? This action cannot be undone.`}
          confirmLabel="Delete"
          danger
          loading={deleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </aside>
  );
}