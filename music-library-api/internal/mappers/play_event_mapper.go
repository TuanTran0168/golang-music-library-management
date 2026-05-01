package mappers

import (
	"music-library-api/internal/dto"
	"music-library-api/internal/repositories"
)

func ToPlayHistoryItem(h repositories.HistoryWithTrack) dto.PlayHistoryItem {
	return dto.PlayHistoryItem{
		EventID:  h.EventID.Hex(),
		PlayedAt: h.PlayedAt,
		Track:    ToTrackResponse(&h.Track),
	}
}

func ToTopTrackResponse(t repositories.TopTrackResult) dto.TopTrackResponse {
	return dto.TopTrackResponse{
		PlayCount: t.PlayCount,
		Track:     ToTrackResponse(&t.Track),
	}
}

func ToGenreStatResponse(g repositories.GenreResult) dto.GenreStatResponse {
	return dto.GenreStatResponse{
		Genre:     g.Genre,
		PlayCount: g.PlayCount,
	}
}
