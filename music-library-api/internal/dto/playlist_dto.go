package dto

import "mime/multipart"

type CreatePlaylistRequest struct {
	Title      string                `form:"title" binding:"required"`
	AlbumCover *multipart.FileHeader `form:"album_cover"`
	TrackIDs   []string              `form:"track_ids"`
}

type UpdatePlaylistRequest struct {
	Title      string   `json:"title"`
	AlbumCover string   `json:"album_cover"`
	TrackIDs   []string `json:"track_ids"`
}

type PlaylistResponse struct {
	ID         string   `json:"id"`
	Title      string   `json:"title"`
	AlbumCover string   `json:"album_cover"`
	TrackIDs   []string `json:"track_ids"`
	CreatedAt  string   `json:"created_at"`
	UpdatedAt  string   `json:"updated_at"`
}
