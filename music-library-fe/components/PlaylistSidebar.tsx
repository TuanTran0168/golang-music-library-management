"use client";

import { useEffect, useState } from "react";
import { Playlist } from "@/types/music";
import { fetchPlaylists } from "@/lib/api";

interface Props {
  onSelect: (playlist: Playlist) => void;
}

export default function PlaylistSidebar({ onSelect }: Props) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlaylists()
      .then(setPlaylists)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading playlists...</div>;

  return (
    <aside className="w-64 p-4 border-r border-gray-300">
      <h2 className="font-bold mb-2">Playlists</h2>
      <ul>
        {playlists.map((pl) => (
          <li
            key={pl.id}
            className="cursor-pointer hover:text-blue-500"
            onClick={() => onSelect(pl)}
          >
            {pl.title}
          </li>
        ))}
      </ul>
    </aside>
  );
}
