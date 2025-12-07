"use client";

import { useState } from "react";
import PlaylistSidebar from "@/components/PlaylistSidebar";
import TrackList from "@/components/TrackList";
import Player from "@/components/Player";
import { Playlist, Track } from "@/types/music";

export default function Home() {
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);

  return (
    <div className="flex h-screen">
      <PlaylistSidebar onSelect={setSelectedPlaylist} />
      <div className="flex flex-col flex-1">
        <TrackList playlist={selectedPlaylist} onPlay={setCurrentTrack} />
        <Player track={currentTrack} />
      </div>
    </div>
  );
}
