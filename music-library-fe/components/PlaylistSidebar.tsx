"use client";

import { useEffect, useState } from "react";
import { Playlist } from "@/types/music";
import { fetchPlaylists } from "@/lib/api";

interface Props {
  onSelect: (playlist: Playlist | null) => void;
  activeView: 'all' | string;
  setActiveView: (view: 'all' | string) => void;
}

export default function PlaylistSidebar({ onSelect, activeView, setActiveView }: Props) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlaylists()
      .then(setPlaylists)
      .finally(() => setLoading(false));
  }, []);
  
  const handleSelect = (playlist: Playlist | null) => {
    onSelect(playlist);
    setActiveView(playlist ? playlist.id : 'all');
  }

  if (loading) return <div className="w-64 p-4 bg-gray-800 text-gray-400">Loading playlists...</div>;

  return (
    <aside className="w-64 p-4 bg-gray-800 border-r border-gray-700 flex-shrink-0">
      <h2 className="text-xl font-bold mb-4 text-white">Views</h2>
      <ul>
        <li
            className={`p-2 cursor-pointer rounded-lg hover:bg-gray-700 transition duration-150 ease-in-out font-bold ${activeView === 'all' ? 'bg-gray-700 text-green-400' : ''}`}
            onClick={() => handleSelect(null)}
        >
            🎧 All Tracks
        </li>
      </ul>
      
      <h2 className="text-xl font-bold mt-6 mb-4 text-white">Playlists</h2>
      <ul>
        {playlists.map((pl) => (
          <li
            key={pl.id}
            className={`p-2 cursor-pointer rounded-lg hover:bg-gray-700 transition duration-150 ease-in-out ${activeView === pl.id ? 'bg-gray-700 text-green-400' : ''}`}
            onClick={() => handleSelect(pl)}
          >
            {pl.title}
          </li>
        ))}
      </ul>
    </aside>
  );
}