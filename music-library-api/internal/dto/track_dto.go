package dto

import (
	"mime/multipart"
	"time"
)

type TrackCreateRequest struct {
	Artist      string                `form:"artist" binding:"required"`
	Album       string                `form:"album"`
	Genre       string                `form:"genre"`
	ReleaseYear int                   `form:"release_year"`
	File        *multipart.FileHeader `form:"file" binding:"required"`
	PlaylistIDs []string              `form:"playlist_ids"`
}

type UpdateTrackRequest struct {
	Title       string `json:"title" binding:"required"`
	Artist      string `json:"artist" binding:"required"`
	Album       string `json:"album"`
	Genre       string `json:"genre"`
	ReleaseYear int    `json:"release_year"`
}

type TrackResponse struct {
	ID        string    `json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	Title       string   `json:"title"`
	Artist      string   `json:"artist"`
	Album       string   `json:"album"`
	Genre       string   `json:"genre"`
	ReleaseYear int      `json:"release_year"`
	Duration    int      `json:"duration"`
	FileID      string   `json:"file_id"`
	PlaylistIDs []string `json:"playlist_ids"`
}

type TrackListResponse struct {
	Page  int             `json:"page"`
	Limit int             `json:"limit"`
	Data  []TrackResponse `json:"data"`
}
