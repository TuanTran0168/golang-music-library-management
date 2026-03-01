"use client";

import { useState, useEffect } from "react";
import { PlaylistSidebar } from "@/components/playlist";
import { TrackList } from "@/components/track";
import { Player } from "@/components/layout";
import { Navbar } from "@/components/layout";
import { Playlist, Track } from "@/types/music";
import { hasRole, isLoggedIn } from "@/lib/auth";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function Home() {
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 400);
  const [activeView, setActiveView] = useState<"all" | string>("all");
  const [playlistRefetchKey, setPlaylistRefetchKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const refetchPlaylists = () => setPlaylistRefetchKey((p) => p + 1);

  const handleSidebarSelect = (playlist: Playlist | null) => {
    setSelectedPlaylist(playlist);
    setActiveView(playlist ? playlist.id : "all");
    setSearchQuery("");
    setSidebarOpen(false);
  };

  const canUpload = isLoggedIn() && hasRole("admin", "artist");
  const canManagePlaylists = isLoggedIn();

  return (
    <div className="flex flex-col" style={{ height: "100dvh", overflow: "hidden" }}>
      <Navbar />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Mobile overlay — click outside closes sidebar */}
        <div
          className={`mobile-overlay ${sidebarOpen ? "open" : ""}`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* Sidebar */}
        <div className={`mobile-sidebar md:relative md:translate-x-0 md:block ${sidebarOpen ? "open" : ""}`}>
          <PlaylistSidebar
            onSelect={handleSidebarSelect}
            activeView={activeView}
            setActiveView={setActiveView}
            refetchKey={playlistRefetchKey}
            refetchPlaylists={refetchPlaylists}
            canManage={canManagePlaylists}
            onClose={() => setSidebarOpen(false)}
          />
        </div>

        {/* Track area */}
        <main className="flex-1 flex flex-col overflow-hidden min-h-0">
          <TrackList
            playlist={selectedPlaylist}
            onPlay={setCurrentTrack}
            searchQuery={searchQuery}
            debouncedQuery={debouncedQuery}
            setSearchQuery={setSearchQuery}
            refetchPlaylists={refetchPlaylists}
            canUpload={canUpload}
            canManagePlaylists={canManagePlaylists}
            onSidebarToggle={() => setSidebarOpen(true)}
          />
        </main>
      </div>

      {/* Player */}
      <Player track={currentTrack} />
    </div>
  );
}