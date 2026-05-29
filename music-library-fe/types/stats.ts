import { Track } from "./music";

export interface TopTrackResponse {
  play_count: number;
  track: Track;
}

export interface TopTracksResponse {
  data: TopTrackResponse[];
}

export interface GenreStatResponse {
  genre: string;
  play_count: number;
}

export interface SummaryResponse {
  total_plays: number;
  total_tracks: number;
  top_genres: GenreStatResponse[];
}

export interface TrackStatsResponse {
  track_id: string;
  play_count: number;
}

export interface PlayHistoryItem {
  event_id: string;
  played_at: string;
  track: Track;
}

export interface PlayHistoryResponse {
  page: number;
  limit: number;
  total_count: number;
  data: PlayHistoryItem[];
}

export interface UserStatsResponse {
  total_plays: number;
  top_tracks: TopTrackResponse[];
}
