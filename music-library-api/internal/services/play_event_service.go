package services

import (
	"encoding/json"

	"music-library-api/internal/dto"
	"music-library-api/internal/mappers"
	"music-library-api/internal/repositories"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type IPlayEventService interface {
	GetHistory(userID string, page, limit int) (*dto.PlayHistoryResponse, error)
	GetTopTracks(limit int) (*dto.TopTracksResponse, error)
	GetSummary() (*dto.SummaryResponse, error)
	GetTrackStats(trackID string) (*dto.TrackStatsResponse, error)
	GetUserStats(userID string) (*dto.UserStatsResponse, error)
}

type playEventService struct {
	repo         repositories.IPlayEventRepository
	cacheRepo    repositories.IStatsCacheRepository
	trackService ITrackService
}

func NewPlayEventService(
	repo repositories.IPlayEventRepository,
	cacheRepo repositories.IStatsCacheRepository,
	trackService ITrackService,
) IPlayEventService {
	return &playEventService{
		repo:         repo,
		cacheRepo:    cacheRepo,
		trackService: trackService,
	}
}

func (s *playEventService) GetHistory(userID string, page, limit int) (*dto.PlayHistoryResponse, error) {
	uid, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}

	history, err := s.repo.GetHistoryWithTracks(uid, page, limit)
	if err != nil {
		return nil, err
	}
	total, err := s.repo.CountHistory(uid)
	if err != nil {
		return nil, err
	}

	items := make([]dto.PlayHistoryItem, 0, len(history))
	for _, h := range history {
		items = append(items, mappers.ToPlayHistoryItem(h))
	}

	return &dto.PlayHistoryResponse{
		Page:       page,
		Limit:      limit,
		TotalCount: total,
		Data:       items,
	}, nil
}

func (s *playEventService) GetTopTracks(limit int) (*dto.TopTracksResponse, error) {
	if cached, err := s.cacheRepo.GetTopTracks(); err == nil && cached != "" {
		var resp dto.TopTracksResponse
		if json.Unmarshal([]byte(cached), &resp) == nil {
			return &resp, nil
		}
	}

	results, err := s.repo.GetTopTracks(limit)
	if err != nil {
		return nil, err
	}

	data := make([]dto.TopTrackResponse, 0, len(results))
	for _, r := range results {
		data = append(data, mappers.ToTopTrackResponse(r))
	}
	resp := &dto.TopTracksResponse{Data: data}

	if raw, err := json.Marshal(resp); err == nil {
		_ = s.cacheRepo.SetTopTracks(string(raw))
	}
	return resp, nil
}

func (s *playEventService) GetSummary() (*dto.SummaryResponse, error) {
	if cached, err := s.cacheRepo.GetSummary(); err == nil && cached != "" {
		var resp dto.SummaryResponse
		if json.Unmarshal([]byte(cached), &resp) == nil {
			return &resp, nil
		}
	}

	totalPlays, err := s.repo.CountTotalPlays()
	if err != nil {
		return nil, err
	}

	totalTracks, err := s.trackService.CountTracks("")
	if err != nil {
		return nil, err
	}

	genreResults, err := s.repo.GetTopGenres(5)
	if err != nil {
		return nil, err
	}

	genres := make([]dto.GenreStatResponse, 0, len(genreResults))
	for _, g := range genreResults {
		genres = append(genres, mappers.ToGenreStatResponse(g))
	}

	resp := &dto.SummaryResponse{
		TotalPlays:  totalPlays,
		TotalTracks: totalTracks,
		TopGenres:   genres,
	}

	if raw, err := json.Marshal(resp); err == nil {
		_ = s.cacheRepo.SetSummary(string(raw))
	}
	return resp, nil
}

func (s *playEventService) GetTrackStats(trackID string) (*dto.TrackStatsResponse, error) {
	if cached, err := s.cacheRepo.GetTrackStats(trackID); err == nil && cached != "" {
		var resp dto.TrackStatsResponse
		if json.Unmarshal([]byte(cached), &resp) == nil {
			return &resp, nil
		}
	}

	tid, err := primitive.ObjectIDFromHex(trackID)
	if err != nil {
		return nil, err
	}

	count, err := s.repo.GetTrackPlayCount(tid)
	if err != nil {
		return nil, err
	}

	resp := &dto.TrackStatsResponse{TrackID: trackID, PlayCount: count}

	if raw, err := json.Marshal(resp); err == nil {
		_ = s.cacheRepo.SetTrackStats(trackID, string(raw))
	}
	return resp, nil
}

func (s *playEventService) GetUserStats(userID string) (*dto.UserStatsResponse, error) {
	if cached, err := s.cacheRepo.GetUserStats(userID); err == nil && cached != "" {
		var resp dto.UserStatsResponse
		if json.Unmarshal([]byte(cached), &resp) == nil {
			return &resp, nil
		}
	}

	uid, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}

	total, err := s.repo.CountUserPlays(uid)
	if err != nil {
		return nil, err
	}

	topResults, err := s.repo.GetUserTopTracks(uid, 10)
	if err != nil {
		return nil, err
	}

	topTracks := make([]dto.TopTrackResponse, 0, len(topResults))
	for _, r := range topResults {
		topTracks = append(topTracks, mappers.ToTopTrackResponse(r))
	}

	resp := &dto.UserStatsResponse{TotalPlays: total, TopTracks: topTracks}

	if raw, err := json.Marshal(resp); err == nil {
		_ = s.cacheRepo.SetUserStats(userID, string(raw))
	}
	return resp, nil
}
