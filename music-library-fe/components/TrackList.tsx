"use client";

import { useEffect, useState } from "react";
import { Playlist, Track } from "@/types/music";
import { fetchTracksFromPlaylist, getStreamURL } from "@/lib/api";

interface Props {
  playlist: Playlist | null;
  onPlay: (track: Track) => void;
}

export default function TrackList({ playlist, onPlay }: Props) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!playlist) return;
    // setLoading(true);
    fetchTracksFromPlaylist(playlist)
      .then(setTracks)
      .finally(() => setLoading(false));
  }, [playlist]);

  if (!playlist) return <div>Select a playlist</div>;
  if (loading) return <div>Loading tracks...</div>;

  return (
    <div className="flex-1 p-4">
      <h2 className="font-bold mb-2">{playlist.title}</h2>
      <ul>
        {tracks.map((t) => (
          <li key={t.id} className="flex justify-between items-center mb-1">
            <span>{t.title} - {t.artist}</span>
            <button
              className="text-blue-500"
              onClick={() => onPlay(t)}
            >
              Play
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
