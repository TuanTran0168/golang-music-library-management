package services

import (
	"music-library-api/internal/models"
	"music-library-api/internal/repositories"
)

type IPlaylistService interface {
	GetPlaylistByID(id string) (*models.Playlist, error)
	GetPlaylists(page, limit int) ([]*models.Playlist, error)
	CreatePlaylist(playlist *models.Playlist) error
	UpdatePlaylist(playlist *models.Playlist) error
	DeletePlaylist(id string) error
}

type PlaylistService struct {
	repo repositories.IPlaylistRepository
}

func NewPlaylistService(repo repositories.IPlaylistRepository) IPlaylistService {
	return &PlaylistService{
		repo: repo,
	}
}

func (s *PlaylistService) GetPlaylistByID(id string) (*models.Playlist, error) {
	return s.repo.GetPlaylistByID(id)
}

func (s *PlaylistService) GetPlaylists(page, limit int) ([]*models.Playlist, error) {
	return s.repo.GetPlaylists(page, limit)
}

func (s *PlaylistService) CreatePlaylist(playlist *models.Playlist) error {
	return s.repo.CreatePlaylist(playlist)
}

func (s *PlaylistService) UpdatePlaylist(playlist *models.Playlist) error {
	return s.repo.UpdatePlaylist(playlist)
}

func (s *PlaylistService) DeletePlaylist(id string) error {
	return s.repo.DeletePlaylist(id)
}
