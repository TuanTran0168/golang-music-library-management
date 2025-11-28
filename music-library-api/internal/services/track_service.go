package services

import (
	"music-library-api/internal/models"
	"music-library-api/internal/repositories"
)

type ITrackService interface {
	GetTrackByID(id string) (*models.Track, error)
	GetTracks(page, limit int) ([]*models.Track, error)
	CreateTrack(track *models.Track) error
	UpdateTrack(track *models.Track) error
	DeleteTrack(id string) error
	SearchTracks(query string, page, limit int) ([]*models.Track, error)
}

type TrackService struct {
	repo repositories.ITrackRepository
}

func NewTrackService(repo repositories.ITrackRepository) ITrackService {
	return &TrackService{
		repo: repo,
	}
}

func (s *TrackService) GetTrackByID(id string) (*models.Track, error) {
	return s.repo.GetTrackByID(id)
}

func (s *TrackService) GetTracks(page, limit int) ([]*models.Track, error) {
	return s.repo.GetTracks(page, limit)
}

func (s *TrackService) CreateTrack(track *models.Track) error {
	return s.repo.CreateTrack(track)
}

func (s *TrackService) UpdateTrack(track *models.Track) error {
	return s.repo.UpdateTrack(track)
}

func (s *TrackService) DeleteTrack(id string) error {
	return s.repo.DeleteTrack(id)
}

func (s *TrackService) SearchTracks(query string, page, limit int) ([]*models.Track, error) {
	return s.repo.SearchTracks(query, page, limit)
}
