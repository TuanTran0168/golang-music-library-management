package mappers

import (
	"music-library-api/internal/dto"
	"music-library-api/internal/models"
)

func ToTrackResponse(m *models.Track) dto.TrackResponse {
	return dto.TrackResponse{
		ID:          m.ID.Hex(),
		CreatedAt:   m.CreatedAt,
		UpdatedAt:   m.UpdatedAt,
		Title:       m.Title,
		Artist:      m.Artist,
		Album:       m.Album,
		Genre:       m.Genre,
		ReleaseYear: m.ReleaseYear,
		Duration:    m.Duration,
		FileID:      m.FileID.Hex(),
		UserID:      m.UserID.Hex(),
	}
}
