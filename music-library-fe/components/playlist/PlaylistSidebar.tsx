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
  onClose?: () => void;
}

export default function PlaylistSidebar({
  onSelect,
  activeView,
  setActiveView,
  refetchKey,
  refetchPlaylists,
  canManage,
  onClose,
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
    <aside className="glass w-64 md:w-64 flex-shrink-0 flex flex-col h-full" style={{ borderRight: "1px solid var(--separator)" }}>
      {/* Mobile header: title + close button */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 md:hidden">
        <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Playlists</span>
        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all active:scale-90"
            style={{ background: "rgba(0,0,0,0.06)", color: "var(--text-muted)" }}
          >
            ✕
          </button>
        )}
      </div>
      <div className="p-4 flex-1 overflow-y-auto">
        <p className="text-[10px] uppercase font-bold tracking-widest mb-3 px-2" style={{ color: "var(--text-muted)" }}>
          Browse
        </p>
        <button
          className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-1`}
          style={activeView === "all" ? {
            background: "var(--accent-light)",
            color: "var(--accent)",
            border: "1px solid rgba(110,108,255,0.2)"
          } : {
            color: "var(--text-secondary)",
            border: "1px solid transparent"
          }}
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
            {playlists.map((pl) => {
              const isActive = activeView === pl.id;
              const canDelete = user?.role === "admin" || user?.id === pl.user_id;
              return (
                <li
                  key={pl.id}
                  className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all text-sm`}
                  style={isActive ? {
                    background: "var(--accent-light)",
                    color: "var(--accent)",
                    border: "1px solid rgba(110,108,255,0.2)"
                  } : {
                    color: "var(--text-secondary)",
                    border: "1px solid transparent"
                  }}
                  onClick={() => handleSelect(pl)}
                >
                  <Link
                    href={`/playlists/${pl.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="truncate font-medium transition"
                    style={{ color: "inherit" }}
                  >
                    🎶 {pl.title}
                  </Link>
                  {canManage && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (canDelete) setDeleteTarget(pl);
                      }}
                      disabled={!canDelete}
                      className={`p-1 rounded-lg flex-shrink-0 transition opacity-0 group-hover:opacity-100`}
                      style={canDelete ? {
                        color: "#ef4444",
                        background: "transparent"
                      } : {
                        color: "var(--text-muted)",
                        cursor: "not-allowed",
                        opacity: "0.3"
                      }}
                      title={!canDelete ? "No permission to delete" : "Delete playlist"}
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 10-2 0v6a1 1 0 102 0V8z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </li>
              );
            })}
            {playlists.length === 0 && !loading && (
              <li className="px-3 py-2 text-xs" style={{ color: "var(--text-muted)" }}>No playlists yet</li>
            )}
          </ul>
        )}
      </div>

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