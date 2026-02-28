package dto

import "mime/multipart"

type PlaylistUpdateMode string

const (
	ModeOverwrite PlaylistUpdateMode = "overwrite"
	ModeAppend    PlaylistUpdateMode = "append"
)

type CreatePlaylistRequest struct {
	Title      string                `form:"title" binding:"required"`
	AlbumCover *multipart.FileHeader `form:"album_cover"`
	TrackIDs   []string              `form:"track_ids"`
}

type UpdatePlaylistRequest struct {
	Title      string                `form:"title"`
	AlbumCover *multipart.FileHeader `form:"album_cover"`
	TrackIDs   []string              `form:"track_ids"`
	Mode       PlaylistUpdateMode    `form:"mode" binding:"omitempty,oneof=overwrite append"`
}

type PlaylistResponse struct {
	ID         string   `json:"id"`
	UserID     string   `json:"user_id"`
	Title      string   `json:"title"`
	AlbumCover string   `json:"album_cover"`
	TrackIDs   []string `json:"track_ids"`
	CreatedAt  string   `json:"created_at"`
	UpdatedAt  string   `json:"updated_at"`
}
