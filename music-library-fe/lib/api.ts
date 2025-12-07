import axios from "axios";
import { Playlist, Track, Paginated } from "@/types/music";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api";

// Axios instance
const api = axios.create({
  baseURL: API_BASE,
});

// ----------------- Playlists -----------------
export async function fetchPlaylists(): Promise<Playlist[]> {
  const res = await api.get<Paginated<Playlist>>("/playlists");
  return res.data.data || [];
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

// ----------------- Stream URL -----------------
export function getStreamURL(track: Track): string {
  return `${API_BASE}/tracks/${track.id}/stream`;
}

export default api;
