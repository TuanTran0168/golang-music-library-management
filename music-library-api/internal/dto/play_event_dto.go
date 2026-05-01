package dto

import "time"

type PlayHistoryItem struct {
	EventID  string        `json:"event_id"`
	PlayedAt time.Time     `json:"played_at"`
	Track    TrackResponse `json:"track"`
}

type PlayHistoryResponse struct {
	Page       int               `json:"page"`
	Limit      int               `json:"limit"`
	TotalCount int64             `json:"total_count"`
	Data       []PlayHistoryItem `json:"data"`
}

type TopTrackResponse struct {
	PlayCount int64         `json:"play_count"`
	Track     TrackResponse `json:"track"`
}

type TopTracksResponse struct {
	Data []TopTrackResponse `json:"data"`
}

type GenreStatResponse struct {
	Genre     string `json:"genre"`
	PlayCount int64  `json:"play_count"`
}

type SummaryResponse struct {
	TotalPlays  int64               `json:"total_plays"`
	TotalTracks int64               `json:"total_tracks"`
	TopGenres   []GenreStatResponse `json:"top_genres"`
}

type TrackStatsResponse struct {
	TrackID   string `json:"track_id"`
	PlayCount int64  `json:"play_count"`
}

type UserStatsResponse struct {
	TotalPlays int64              `json:"total_plays"`
	TopTracks  []TopTrackResponse `json:"top_tracks"`
}
