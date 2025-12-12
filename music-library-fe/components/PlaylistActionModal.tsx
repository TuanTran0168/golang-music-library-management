"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Playlist } from '@/types/music'; // Assumes '@/types/music' has your Playlist interface
import { fetchPlaylists, createPlaylist, updatePlaylistTracks } from '@/lib/api'; 

interface Props {
  selectedTrackIds: string[];
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PlaylistActionModal({ selectedTrackIds, onSuccess, onCancel }: Props) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<'create' | 'update'>('create');
  
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  
  const [selectedPlaylistId, setSelectedPlaylistId] = useState('');
  const [updateMode, setUpdateMode] = useState<'append' | 'overwrite'>('append');

  useEffect(() => {
    fetchPlaylists()
      .then(setPlaylists)
      .finally(() => setLoading(false));
  }, []);

  const tracksCount = selectedTrackIds.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (mode === 'create') {
        if (!newPlaylistTitle.trim()) return;

        const fd = new FormData();
        fd.append('title', newPlaylistTitle);
        selectedTrackIds.forEach(id => fd.append('track_ids', id));
        
        await createPlaylist(fd);
        alert(`Playlist "${newPlaylistTitle}" created successfully!`);

      } else if (mode === 'update') {
        if (!selectedPlaylistId) return;

        const fd = new FormData();
        fd.append('mode', updateMode);
        selectedTrackIds.forEach(id => fd.append('track_ids', id));

        await updatePlaylistTracks(selectedPlaylistId, fd);
        const playlistTitle = playlists.find(p => p.id === selectedPlaylistId)?.title || 'Selected Playlist';
        alert(`${tracksCount} track(s) successfully added to "${playlistTitle}".`);
      }

      onSuccess();
    } catch (error) {
      console.error(`Failed to ${mode} playlist:`, error);
      alert(`Operation failed! Check console for details.`);
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = useMemo(() => {
    if (mode === 'create') {
      return newPlaylistTitle.trim().length > 0;
    }
    if (mode === 'update') {
      return selectedPlaylistId.length > 0;
    }
    return false;
  }, [mode, newPlaylistTitle, selectedPlaylistId]);

  if (loading) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-lg text-white">
        <h3 className="text-3xl font-extrabold mb-4 border-b border-gray-700 pb-2">
          Playlist Action
        </h3>
        <p className="text-gray-300 mb-6">
          <span className="font-bold text-lg text-green-400">{tracksCount}</span> track(s) selected.
        </p>

        {/* Mode Selector */}
        <div className="flex space-x-4 mb-6">
          <button
            type="button"
            onClick={() => setMode('create')}
            className={`flex-1 py-3 rounded-lg font-semibold transition ${mode === 'create' ? 'bg-green-600 text-black' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            Create New Playlist
          </button>
          <button
            type="button"
            onClick={() => setMode('update')}
            className={`flex-1 py-3 rounded-lg font-semibold transition ${mode === 'update' ? 'bg-green-600 text-black' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            Add to Existing
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'create' && (
            <div className="space-y-4">
              <label htmlFor="newTitle" className="block font-medium text-gray-300">New Playlist Title</label>
              <input
                id="newTitle"
                type="text"
                placeholder="e.g., My Awesome Mix"
                value={newPlaylistTitle}
                onChange={(e) => setNewPlaylistTitle(e.target.value)}
                className="w-full p-3 rounded-md bg-gray-900 text-white placeholder-gray-500 border border-gray-700 focus:border-green-500"
                required
              />
            </div>
          )}

          {mode === 'update' && (
            <div className="space-y-4">
              <label htmlFor="playlistSelect" className="block font-medium text-gray-300">Select Playlist</label>
              <select
                id="playlistSelect"
                value={selectedPlaylistId}
                onChange={(e) => setSelectedPlaylistId(e.target.value)}
                className="w-full p-3 rounded-md bg-gray-900 text-white border border-gray-700 focus:border-green-500"
                required
              >
                <option value="" disabled>Select a playlist...</option>
                {playlists.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>

              <label className="block font-medium text-gray-300 pt-2">Track Update Mode</label>
              <div className="flex items-center space-x-6">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="updateMode"
                    value="append"
                    checked={updateMode === 'append'}
                    onChange={() => setUpdateMode('append')}
                    className="form-radio h-4 w-4 text-green-500 transition duration-150 ease-in-out"
                  />
                  <span className="ml-2">Append (Add to end)</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="updateMode"
                    value="overwrite"
                    checked={updateMode === 'overwrite'}
                    onChange={() => setUpdateMode('overwrite')}
                    className="form-radio h-4 w-4 text-green-500 transition duration-150 ease-in-out"
                  />
                  <span className="ml-2">Overwrite (Replace all)</span>
                </label>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-8 pt-4 border-t border-gray-700">
            <button 
              type="button" 
              onClick={onCancel} 
              className="px-6 py-2 text-gray-400 rounded-full hover:bg-gray-700 transition"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !isFormValid || tracksCount === 0}
              className="px-6 py-2 bg-green-500 text-black font-bold rounded-full disabled:opacity-50 transition"
            >
              {submitting ? 'Processing...' : `Perform Action (${tracksCount})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}