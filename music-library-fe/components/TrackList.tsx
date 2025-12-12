"use client";

import { useEffect, useState, Dispatch, SetStateAction, useMemo } from "react";
import { Playlist, Track } from "@/types/music";
// Removed deleteTrack
import { fetchTracksFromPlaylist, fetchAllTracks, searchTracks } from "@/lib/api"; 
import UploadTrack from "@/components/UploadTrack";
import PlaylistActionModal from '@/components/PlaylistActionModal';

interface Props {
  playlist: Playlist | null;
  onPlay: (track: Track) => void;
  searchQuery: string;
  debouncedQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  refetchPlaylists: () => void;
}

const formatDuration = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};


export default function TrackList({ playlist, onPlay, searchQuery, debouncedQuery, setSearchQuery, refetchPlaylists }: Props) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true); 
  const [playlistFilterQuery, setPlaylistFilterQuery] = useState('');
  
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([]);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [localTrackRefetchKey, setLocalTrackRefetchKey] = useState(0);

  useEffect(() => {
    let isStale = false; 

    const fetchTracks = async () => {
        setLoading(true); 
        setPlaylistFilterQuery(''); 

        let fetchPromise: Promise<Track[]> | null = null;
        
        if (playlist) {
            fetchPromise = fetchTracksFromPlaylist(playlist);
        } else if (debouncedQuery) {
            fetchPromise = searchTracks(debouncedQuery);
        } else {
            fetchPromise = fetchAllTracks();
        }

        if (fetchPromise) {
            try {
                const fetchedTracks = await fetchPromise;
                if (!isStale) { 
                    setTracks(fetchedTracks);
                }
            } catch (error) {
                console.error("Error fetching tracks:", error);
                if (!isStale) {
                    setTracks([]);
                }
            } finally {
                if (!isStale) { 
                    setLoading(false);
                }
            }
        } else {
            if (!isStale) {
                setTracks([]);
                setLoading(false);
            }
        }
    };

    fetchTracks();

    return () => {
        isStale = true;
    };
  }, [playlist, debouncedQuery, localTrackRefetchKey]);

  const toggleTrackSelection = (trackId: string) => {
    setSelectedTrackIds(prev => 
        prev.includes(trackId)
            ? prev.filter(id => id !== trackId)
            : [...prev, trackId]
    );
  }
  
  const handleActionSuccess = () => {
      setIsActionModalOpen(false);
      setSelectedTrackIds([]);
      refetchPlaylists();
      if (playlist) {
        setLocalTrackRefetchKey(prev => prev + 1);
      }
  }

  const handleActionCancel = () => {
      setIsActionModalOpen(false);
  }

  // Track deletion handler removed

  const filteredTracks = useMemo(() => {
    if (!playlist || !playlistFilterQuery.trim()) {
      return tracks;
    }

    const query = playlistFilterQuery.toLowerCase();
    
    return tracks.filter(t => 
      t.title.toLowerCase().includes(query) ||
      t.artist.toLowerCase().includes(query) ||
      t.album.toLowerCase().includes(query) ||
      t.genre.toLowerCase().includes(query)
    );
  }, [tracks, playlistFilterQuery, playlist]);

  let displayTitle = "Music Library";
  if (playlist) {
      displayTitle = playlist.title;
  } else if (debouncedQuery) {
      displayTitle = `Search Results for "${debouncedQuery}"`;
  } else {
      displayTitle = 'All Tracks';
  }

  if (loading && tracks.length === 0) return <div className="flex-1 p-8 text-gray-400">Loading tracks...</div>;

  const isTransitioning = loading && tracks.length > 0;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  }

  const baseGridTemplate = 'grid-cols-[30px_30px_4fr_1.5fr_1fr_1fr_max-content_max-content]';
  const mdGridTemplate = 'md:grid-cols-[30px_30px_4fr_1.5fr_1.5fr_1fr_max-content_max-content]';
  const trackGridClasses = `grid gap-4 ${baseGridTemplate} ${mdGridTemplate}`;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
        
        {isActionModalOpen && selectedTrackIds.length > 0 && (
            <PlaylistActionModal 
                selectedTrackIds={selectedTrackIds} 
                onSuccess={handleActionSuccess} 
                onCancel={handleActionCancel}
            />
        )}
      
      <div className="p-8 pb-4">
          <form onSubmit={handleFormSubmit}>
            {!playlist && (
                <input
                  type="text"
                  placeholder="Search for songs, artists, or albums (API Search)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full p-3 rounded-full bg-gray-700 text-white placeholder-gray-400 border border-transparent focus:border-green-500 focus:ring-1 focus:ring-green-500 transition duration-150"
                />
            )}
            
            {playlist && (
                <input
                  type="text"
                  placeholder={`Filter tracks in ${playlist.title} (Client-side)...`}
                  value={playlistFilterQuery}
                  onChange={(e) => setPlaylistFilterQuery(e.target.value)}
                  className="w-full p-3 rounded-full bg-gray-700 text-white placeholder-gray-400 border border-transparent focus:border-green-500 focus:ring-1 focus:ring-green-500 transition duration-150"
                />
            )}
          </form>
      </div>

      <div className={`relative flex-1 p-8 pt-0 overflow-y-auto transition-opacity duration-300 ${isTransitioning ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-extrabold text-white">{displayTitle}</h2>
            
            {selectedTrackIds.length > 0 && (
                <div className="space-x-4">
                    {/* Only the Playlist Action button remains */}
                    <button
                        onClick={() => setIsActionModalOpen(true)}
                        disabled={loading}
                        className="px-4 py-2 bg-yellow-500 text-black font-bold rounded-full transition duration-150 ease-in-out disabled:opacity-50"
                    >
                        Playlist Action ({selectedTrackIds.length})
                    </button>
                </div>
            )}
        </div>
        
        <div className={`py-2 px-3 text-xs font-semibold text-gray-400 border-b border-gray-700 uppercase ${trackGridClasses}`}>
            <span className="text-center">#</span>
            <span className="text-center"></span>
            <span className="col-span-1">Title</span>
            <span>Artist</span>
            <span className="hidden md:block">Album</span>
            <span>Genre</span>
            <span className="text-right">Year</span>
            <span className="text-right">Duration</span>
        </div>

        <ul className="space-y-1">
          {filteredTracks.map((t, index) => {
            const isSelected = selectedTrackIds.includes(t.id);
            return (
              <li 
                key={t.id} 
                className={`items-center p-3 rounded-md transition duration-150 ease-in-out group ${trackGridClasses} ${isSelected ? 'bg-gray-700' : 'hover:bg-gray-800'}`}
              >
                  <span className="text-gray-400 text-center">
                      {(index + 1).toString().padStart(2, '0')}
                  </span>
                  
                  <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleTrackSelection(t.id)}
                      className="form-checkbox h-4 w-4 text-green-500 bg-gray-900 border-gray-600 rounded cursor-pointer transition duration-150 ease-in-out"
                  />
                  
                  <div className="flex items-center min-w-0">
                      <span className="truncate mr-4 font-medium text-white">{t.title}</span>
                      <button
                        className="text-white px-3 py-1 bg-green-500 rounded-full text-xs font-semibold opacity-0 group-hover:opacity-100 transition duration-150 ease-in-out flex-shrink-0"
                        onClick={() => onPlay(t)}
                      >
                        Play
                      </button>
                  </div>
                  
                  <span className="truncate text-gray-400">{t.artist}</span>
                  
                  <span className="truncate text-gray-400 hidden md:block">{t.album}</span>
                  
                  <span className="truncate text-gray-400">{t.genre}</span>

                  <span className="text-right text-gray-400">{t.release_year || '-'}</span>

                  <span className="text-right text-gray-400">{formatDuration(t.duration)}</span>
              </li>
          )})}
        </ul>
        
        {filteredTracks.length === 0 && (
            <p className="text-gray-400 mt-4">
               {playlistFilterQuery ? `No tracks match "${playlistFilterQuery}".` : (debouncedQuery ? `No results found for "${debouncedQuery}".` : `No tracks found. Upload one to get started!`)}
            </p>
        )}

        {isTransitioning && (
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-green-500 font-bold text-xl">
                Fetching new results...
            </div>
        )}
      </div>

      {!playlist && <UploadTrack onUploadSuccess={() => setLocalTrackRefetchKey(prev => prev + 1)} />}
      
    </div>
  );
}