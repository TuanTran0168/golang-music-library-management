"use client";

import { useState, useEffect } from "react";
import PlaylistSidebar from "@/components/PlaylistSidebar";
import TrackList from "@/components/TrackList";
import Player from "@/components/Player";
import { Playlist, Track } from "@/types/music";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function Home() {
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  
  // State for search functionality (only used when selectedPlaylist is null)
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);
  const [activeView, setActiveView] = useState<'all' | string>('all'); 

  const handleSidebarSelect = (playlist: Playlist | null) => {
    setSelectedPlaylist(playlist);
    setActiveView(playlist ? playlist.id : 'all');
    setSearchQuery('');
  }

  
  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="flex flex-1 overflow-hidden">
        <PlaylistSidebar 
          onSelect={handleSidebarSelect} 
          activeView={activeView} 
          setActiveView={setActiveView} 
        />
        <main className="flex flex-col flex-1 overflow-auto">
          <TrackList 
            playlist={selectedPlaylist} 
            onPlay={setCurrentTrack} 
            searchQuery={searchQuery}
            debouncedQuery={debouncedQuery}
            setSearchQuery={setSearchQuery}
          />
        </main>
      </div>
      
      <div className="sticky bottom-0 w-full bg-gray-800 border-t border-gray-700">
        <Player track={currentTrack} />
      </div>
    </div>
  );
}