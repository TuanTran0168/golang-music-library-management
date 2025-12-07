"use client";

import { useEffect, useState } from "react";
import { Playlist } from "@/types/music";
import { fetchPlaylists, deletePlaylist } from "@/lib/api";

interface Props {
  onSelect: (playlist: Playlist | null) => void;
  activeView: 'all' | string;
  setActiveView: (view: 'all' | string) => void;
  refetchKey: number;
  refetchPlaylists: () => void;
}

export default function PlaylistSidebar({ onSelect, activeView, setActiveView, refetchKey, refetchPlaylists }: Props) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlaylists()
      .then(setPlaylists)
      .finally(() => setLoading(false));
  }, [refetchKey]);
  
  const handleSelect = (playlist: Playlist | null) => {
    onSelect(playlist);
    setActiveView(playlist ? playlist.id : 'all');
  }
  
  const handleDeletePlaylist = async (e: React.MouseEvent, playlist: Playlist) => {
    e.stopPropagation();

    if (!confirm(`Are you sure you want to delete the playlist "${playlist.title}"? This cannot be undone.`)) {
        return;
    }

    try {
        await deletePlaylist(playlist.id);
        
        if (activeView === playlist.id) {
            handleSelect(null);
        }
        
        refetchPlaylists();
        
        alert(`Playlist "${playlist.title}" deleted successfully.`);

    } catch (error) {
        console.error("Failed to delete playlist:", error);
        alert("Failed to delete playlist. Check console for details.");
    }
};


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
            className={`p-2 cursor-pointer rounded-lg hover:bg-gray-700 transition duration-150 ease-in-out group flex justify-between items-center ${activeView === pl.id ? 'bg-gray-700 text-green-400 font-bold' : ''}`}
            onClick={() => handleSelect(pl)}
          >
            <span className="truncate">{pl.title}</span>
            <button
                onClick={(e) => handleDeletePlaylist(e, pl)}
                title={`Delete ${pl.title}`}
                className="text-red-500 hover:text-red-400 p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 10-2 0v6a1 1 0 102 0V8z" clipRule="evenodd" />
                </svg>
            </button>
          </li>
        ))}
        {playlists.length === 0 && !loading && (
          <li className="p-2 text-gray-400 text-sm">No playlists created yet.</li>
        )}
      </ul>
    </aside>
  );
}