import axios from "axios";
import { Playlist, Track, Paginated } from "@/types/music";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api";

const api = axios.create({
  baseURL: API_BASE,
});

// ----------------- Playlists -----------------
export async function fetchPlaylists(): Promise<Playlist[]> {
  const res = await api.get<Paginated<Playlist>>("/playlists");
  return res.data.data || [];
}

export async function createPlaylist(formData: FormData): Promise<Playlist> {
  const res = await api.post<Playlist>("/playlists", formData);
  return res.data;
}

export async function updatePlaylistTracks(playlistId: string, formData: FormData): Promise<Playlist> {
  const res = await api.patch<Playlist>(`/playlists/${playlistId}/tracks`, formData);
  return res.data;
}

export async function deletePlaylist(id: string): Promise<void> {
  await api.delete(`/playlists/${id}`);
}

// ----------------- Tracks -----------------
export async function fetchTracksFromPlaylist(playlist: Playlist): Promise<Track[]> {
  return Promise.all(
    playlist.track_ids.map(async (id) => {
      const res = await api.get<Track>(`/tracks/${id}`);
      return res.data;
    })
  );
}

export async function fetchAllTracks(): Promise<Track[]> {
  const res = await api.get<Paginated<Track>>("/tracks", {
    params: { page: 1, limit: 1000 },
  });
  return res.data.data || [];
}

export async function searchTracks(query: string): Promise<Track[]> {
    const res = await api.get<Paginated<Track>>("/tracks/search", {
        params: { q: query, page: 1, limit: 100 },
    });
    return res.data.data || [];
}

export async function deleteTrack(id: string): Promise<void> {
  await api.delete(`/tracks/${id}`);
}

// ----------------- Stream URL -----------------
export function getStreamURL(track: Track): string {
  return `${API_BASE}/tracks/${track.id}/stream`;
}

export default api;