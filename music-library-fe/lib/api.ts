import axios, { AxiosRequestConfig } from "axios";
import { Playlist, Track, Paginated } from "@/types/music";
import { getToken, clearAuth, refreshAccessToken } from "./auth";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api";
export const DEFAULT_PAGE_SIZE = 12;

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // forward cookies (e.g., refresh_token) automatically
});

// ------ Request Interceptor: attach access token ------
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ------ Response Interceptor: silent token refresh on 401 ------
let isRefreshing = false;
let pendingQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

function processPendingQueue(error: unknown, token: string | null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  pendingQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers = { ...originalRequest.headers, Authorization: `Bearer ${token}` };
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const newToken = await refreshAccessToken();
    isRefreshing = false;

    if (newToken) {
      processPendingQueue(null, newToken);
      originalRequest.headers = { ...originalRequest.headers, Authorization: `Bearer ${newToken}` };
      return api(originalRequest);
    } else {
      processPendingQueue(new Error("Session expired"), null);
      clearAuth();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth:logout"));
      }
      return Promise.reject(error);
    }
  }
);

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

// ----------------- Users (Admin) -----------------
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

export async function fetchUserById(userId: string): Promise<UserItem> {
  const res = await api.get<UserItem>(`/users/${userId}`);
  return res.data;
}

export async function updateUserRole(userId: string, role: string): Promise<UserItem> {
  const res = await api.patch<UserItem>(`/users/${userId}/role`, { role });
  return res.data;
}

export async function updateUserInfo(userId: string, data: { name: string; email: string }): Promise<UserItem> {
  const res = await api.patch<UserItem>(`/users/${userId}/info`, data);
  return res.data;
}

// ----------------- Profile (self) -----------------
export async function fetchMe(): Promise<UserItem> {
  const res = await api.get<UserItem>("/users/me");
  return res.data;
}

export async function updateMe(data: { name: string; email: string }): Promise<UserItem> {
  const res = await api.patch<UserItem>("/users/me", data);
  return res.data;
}

export async function changePassword(data: { current_password: string; new_password: string }): Promise<void> {
  await api.patch("/users/me/password", data);
}

// ----------------- Stream URL -----------------
export function getStreamURL(track: Track): string {
  return `${API_BASE}/tracks/${track.id}/stream`;
}

export default api;