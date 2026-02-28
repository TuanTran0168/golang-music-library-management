package mappers

import (
	"music-library-api/internal/dto"
	"music-library-api/internal/models"
)

func ToPlaylistResponse(pl *models.Playlist) dto.PlaylistResponse {
	ids := make([]string, len(pl.TrackIDs))
	for i, id := range pl.TrackIDs {
		ids[i] = id.Hex()
	}

	return dto.PlaylistResponse{
		ID:         pl.ID.Hex(),
		UserID:     pl.UserID.Hex(),
		Title:      pl.Title,
		AlbumCover: pl.AlbumCover,
		TrackIDs:   ids,
		CreatedAt:  pl.CreatedAt.String(),
		UpdatedAt:  pl.UpdatedAt.String(),
	}
}
