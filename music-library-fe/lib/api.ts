import axios from "axios";
import { Playlist, Track, Paginated } from "@/types/music";
import { getToken } from "./auth";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api";
export const DEFAULT_PAGE_SIZE = 12;

const api = axios.create({
  baseURL: API_BASE,
});

// Attach auth token to every request
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ----------------- Playlists -----------------
export async function fetchPlaylists(page = 1, limit = 50, myPlaylists?: boolean): Promise<Playlist[]> {
  const params: Record<string, string | number | boolean> = { page, limit };
  if (myPlaylists) params.myPlaylists = true;

  const res = await api.get<Paginated<Playlist>>("/playlists", { params });
  return res.data.data || [];
}

export async function createPlaylist(formData: FormData): Promise<Playlist> {
  const res = await api.post<Playlist>("/playlists", formData);
  return res.data;
}

export async function updatePlaylistTracks(playlistId: string, formData: FormData): Promise<Playlist> {
  const res = await api.patch<Playlist>(`/playlists/${playlistId}`, formData);
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

export async function fetchTracks(page = 1, limit = DEFAULT_PAGE_SIZE, myTracks?: boolean): Promise<Paginated<Track>> {
  const params: Record<string, string | number | boolean> = { page, limit };
  if (myTracks) params.myTracks = true;

  const res = await api.get<Paginated<Track>>("/tracks", { params });
  return res.data;
}

export async function searchTracks(query: string, page = 1, limit = DEFAULT_PAGE_SIZE, myTracks?: boolean): Promise<Paginated<Track>> {
  const params: Record<string, string | number | boolean> = { q: query, page, limit };
  if (myTracks) params.myTracks = true;

  const res = await api.get<Paginated<Track>>("/tracks/search", { params });
  return res.data;
}

export async function deleteTrack(id: string): Promise<void> {
  await api.delete(`/tracks/${id}`);
}

export async function fetchTrackById(id: string): Promise<Track> {
  const res = await api.get<Track>(`/tracks/${id}`);
  return res.data;
}

export async function updateTrack(id: string, data: { title: string; artist: string; album?: string; genre?: string; release_year?: number }): Promise<Track> {
  const res = await api.patch<Track>(`/tracks/${id}`, data);
  return res.data;
}

export async function fetchPlaylistById(id: string): Promise<Playlist> {
  const res = await api.get<Playlist>(`/playlists/${id}`);
  return res.data;
}

export async function updatePlaylist(id: string, formData: FormData): Promise<Playlist> {
  const res = await api.patch<Playlist>(`/playlists/${id}`, formData);
  return res.data;
}

// ----------------- Admin: Users -----------------
export interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export async function fetchUsers(page = 1, limit = 20): Promise<{ data: UserItem[]; page: number; limit: number; total_count: number }> {
  const res = await api.get("/users", { params: { page, limit } });
  return res.data;
}

export async function updateUserRole(userId: string, role: string): Promise<UserItem> {
  const res = await api.patch<UserItem>(`/users/${userId}/role`, { role });
  return res.data;
}

// ----------------- Stream URL -----------------
export function getStreamURL(track: Track): string {
  return `${API_BASE}/tracks/${track.id}/stream`;
}

export default api;