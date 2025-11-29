package dto

type CreatePlaylistRequest struct {
	Title      string   `json:"title" binding:"required"`
	AlbumCover string   `json:"album_cover"`
	TrackIDs   []string `json:"track_ids"`
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
