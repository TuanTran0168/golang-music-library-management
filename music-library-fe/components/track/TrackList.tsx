"use client";

import { useEffect, useState, Dispatch, SetStateAction } from "react";
import { Playlist, Track, Paginated } from "@/types/music";
import { fetchTracksFromPlaylist, fetchTracks, searchTracks, DEFAULT_PAGE_SIZE } from "@/lib/api";
import UploadTrack from "./UploadTrack";
import { PlaylistActionModal } from "@/components/playlist";

interface Props {
  playlist: Playlist | null;
  onPlay: (track: Track) => void;
  searchQuery: string;
  debouncedQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  refetchPlaylists: () => void;
  canUpload: boolean;
  canManagePlaylists: boolean;
  myTracks?: boolean;
}

const formatDuration = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export default function TrackList({
  playlist,
  onPlay,
  searchQuery,
  debouncedQuery,
  setSearchQuery,
  refetchPlaylists,
  canUpload,
  canManagePlaylists,
  myTracks,
}: Props) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [playlistFilterQuery, setPlaylistFilterQuery] = useState("");
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([]);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [localTrackRefetchKey, setLocalTrackRefetchKey] = useState(0);

  const totalPages = Math.max(1, Math.ceil(totalCount / DEFAULT_PAGE_SIZE));

  // Reset page when switching views
  useEffect(() => {
    setPage(1);
    setPlaylistFilterQuery("");
    setSelectedTrackIds([]);
  }, [playlist, debouncedQuery]);

  useEffect(() => {
    let isStale = false;

    const doFetch = async () => {
      setLoading(true);

      try {
        if (playlist) {
          const fetched = await fetchTracksFromPlaylist(playlist);
          if (!isStale) {
            setTracks(fetched);
            setTotalCount(fetched.length);
          }
        } else if (debouncedQuery) {
          const result: Paginated<Track> = await searchTracks(debouncedQuery, page, DEFAULT_PAGE_SIZE, myTracks);
          if (!isStale) {
            setTracks(result.data || []);
            setTotalCount(result.total_count || 0);
          }
        } else {
          const result: Paginated<Track> = await fetchTracks(page, DEFAULT_PAGE_SIZE, myTracks);
          if (!isStale) {
            setTracks(result.data || []);
            setTotalCount(result.total_count || 0);
          }
        }
      } catch (error) {
        console.error("Error fetching tracks:", error);
        if (!isStale) {
          setTracks([]);
          setTotalCount(0);
        }
      } finally {
        if (!isStale) setLoading(false);
      }
    };

    doFetch();
    return () => { isStale = true; };
  }, [playlist, debouncedQuery, page, localTrackRefetchKey]);

  // Filter tracks in playlist view (client-side)
  const displayTracks = playlist && playlistFilterQuery.trim()
    ? tracks.filter((t) => {
      const q = playlistFilterQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q) ||
        t.genre.toLowerCase().includes(q)
      );
    })
    : tracks;

  const toggleTrackSelection = (trackId: string) => {
    setSelectedTrackIds((prev) =>
      prev.includes(trackId) ? prev.filter((id) => id !== trackId) : [...prev, trackId]
    );
  };

  const handleActionSuccess = () => {
    setIsActionModalOpen(false);
    setSelectedTrackIds([]);
    refetchPlaylists();
    if (playlist) setLocalTrackRefetchKey((p) => p + 1);
  };

  let displayTitle = "All Tracks";
  if (playlist) displayTitle = playlist.title;
  else if (debouncedQuery) displayTitle = `Search: "${debouncedQuery}"`;

  const renderPagination = () => {
    if (playlist || totalPages <= 1) return null;

    const pages: number[] = [];
    const spread = 2;
    for (let i = Math.max(1, page - spread); i <= Math.min(totalPages, page + spread); i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-center gap-2 py-4 fade-in">
        <button
          className="pagination-btn"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
        >
          ‹
        </button>
        {pages[0] > 1 && (
          <>
            <button className="pagination-btn" onClick={() => setPage(1)}>1</button>
            {pages[0] > 2 && <span className="text-gray-500 text-sm px-1">…</span>}
          </>
        )}
        {pages.map((p) => (
          <button
            key={p}
            className={`pagination-btn ${p === page ? "active" : ""}`}
            onClick={() => setPage(p)}
          >
            {p}
          </button>
        ))}
        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && <span className="text-gray-500 text-sm px-1">…</span>}
            <button className="pagination-btn" onClick={() => setPage(totalPages)}>
              {totalPages}
            </button>
          </>
        )}
        <button
          className="pagination-btn"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
        >
          ›
        </button>
      </div>
    );
  };

  if (loading && tracks.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ color: "var(--text-muted)" }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Loading tracks...</p>
        </div>
      </div>
    );
  }

  const isTransitioning = loading && tracks.length > 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {isActionModalOpen && selectedTrackIds.length > 0 && (
        <PlaylistActionModal
          selectedTrackIds={selectedTrackIds}
          onSuccess={handleActionSuccess}
          onCancel={() => setIsActionModalOpen(false)}
        />
      )}

      {/* Search Bar */}
      <div className="p-4 md:p-6 pb-2">
        {!playlist ? (
          <input
            type="text"
            placeholder="🔍  Search tracks, artists, albums..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-input w-full p-3.5 text-sm"
          />
        ) : (
          <input
            type="text"
            placeholder={`🔍  Filter in ${playlist.title}...`}
            value={playlistFilterQuery}
            onChange={(e) => setPlaylistFilterQuery(e.target.value)}
            className="glass-input w-full p-3.5 text-sm"
          />
        )}
      </div>

      {/* Title + Actions */}
      <div className="px-4 md:px-6 pb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">{displayTitle}</h2>
          {!playlist && (
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              {totalCount} track{totalCount !== 1 ? "s" : ""} {debouncedQuery ? "found" : "total"}
            </p>
          )}
        </div>

        {selectedTrackIds.length > 0 && canManagePlaylists && (
          <button
            onClick={() => setIsActionModalOpen(true)}
            disabled={loading}
            className="btn-accent text-xs !py-2 !px-4"
          >
            Playlist Action ({selectedTrackIds.length})
          </button>
        )}
      </div>

      {/* Track List */}
      <div
        className={`flex-1 px-4 md:px-6 overflow-y-auto transition-opacity duration-300 ${isTransitioning ? "opacity-50 pointer-events-none" : ""
          }`}
      >
        {/* Header row - desktop */}
        <div className="hidden md:grid grid-cols-[30px_30px_1fr_120px_120px_80px_60px] gap-3 py-2 px-3 mb-1 text-xs font-semibold uppercase" style={{ color: "var(--text-muted)" }}>
          <span className="text-center">#</span>
          <span />
          <span>Title / Artist</span>
          <span>Album</span>
          <span>Genre</span>
          <span className="text-right">Year</span>
          <span className="text-right">Time</span>
        </div>

        <ul className="space-y-1 pb-2">
          {displayTracks.map((t, index) => {
            const isSelected = selectedTrackIds.includes(t.id);
            return (
              <li
                key={t.id}
                className={`glass-card !rounded-xl p-3 group fade-in cursor-pointer ${isSelected ? "!border-purple-500/40 !bg-purple-500/10" : ""
                  }`}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                {/* Mobile layout */}
                <div className="md:hidden flex items-center gap-3">
                  {canManagePlaylists && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleTrackSelection(t.id)}
                      className="w-4 h-4 rounded accent-purple-500 flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0" onClick={() => onPlay(t)}>
                    <p className="font-medium truncate text-sm">{t.title}</p>
                    <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                      {t.artist} {t.album ? `• ${t.album}` : ""}
                    </p>
                  </div>
                  <span className="text-xs flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                    {formatDuration(t.duration)}
                  </span>
                  <button
                    className="btn-accent !py-1.5 !px-3 !text-xs !rounded-lg opacity-0 group-hover:opacity-100 flex-shrink-0 transition"
                    onClick={() => onPlay(t)}
                  >
                    ▶
                  </button>
                </div>

                {/* Desktop layout */}
                <div className="hidden md:grid grid-cols-[30px_30px_1fr_120px_120px_80px_60px] gap-3 items-center">
                  <span className="text-center text-xs" style={{ color: "var(--text-muted)" }}>
                    {((page - 1) * DEFAULT_PAGE_SIZE + index + 1).toString().padStart(2, "0")}
                  </span>

                  {canManagePlaylists ? (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleTrackSelection(t.id)}
                      className="w-4 h-4 rounded accent-purple-500"
                    />
                  ) : (
                    <span />
                  )}

                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">{t.title}</p>
                      <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                        {t.artist}
                      </p>
                    </div>
                    <button
                      className="btn-accent !py-1 !px-3 !text-xs !rounded-lg opacity-0 group-hover:opacity-100 flex-shrink-0 transition"
                      onClick={() => onPlay(t)}
                    >
                      ▶ Play
                    </button>
                  </div>

                  <span className="truncate text-xs" style={{ color: "var(--text-secondary)" }}>{t.album || "—"}</span>
                  <span className="truncate text-xs" style={{ color: "var(--text-secondary)" }}>{t.genre || "—"}</span>
                  <span className="text-right text-xs" style={{ color: "var(--text-muted)" }}>{t.release_year || "—"}</span>
                  <span className="text-right text-xs" style={{ color: "var(--text-muted)" }}>{formatDuration(t.duration)}</span>
                </div>
              </li>
            );
          })}
        </ul>

        {displayTracks.length === 0 && (
          <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>
            <p className="text-4xl mb-3">🎵</p>
            <p className="text-sm">
              {playlistFilterQuery
                ? `No tracks match "${playlistFilterQuery}"`
                : debouncedQuery
                  ? `No results for "${debouncedQuery}"`
                  : "No tracks yet"}
            </p>
          </div>
        )}

        {renderPagination()}
      </div>

      {/* Upload - only for admin/artist */}
      {canUpload && !playlist && (
        <UploadTrack onUploadSuccess={() => setLocalTrackRefetchKey((p) => p + 1)} />
      )}
    </div>
  );
}