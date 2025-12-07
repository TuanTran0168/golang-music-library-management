// ----------------- Playlist -----------------
export interface Playlist {
  id: string;
  title: string;
  album_cover: string;
  track_ids: string[];
  created_at: string;
  updated_at: string;
}

// ----------------- Track -----------------
export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  release_year: number;
  file_id: string;
  duration: number;
  created_at: string;
  updated_at: string;
}

// ----------------- Paginated -----------------
export interface Paginated<T> {
  data: T[];
  page: number;
  limit: number;
}
