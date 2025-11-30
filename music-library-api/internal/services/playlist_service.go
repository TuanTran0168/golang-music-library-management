package services

import (
	"fmt"
	"mime/multipart"
	"music-library-api/internal/dto"
	"music-library-api/internal/models"
	"music-library-api/internal/repositories"
	"music-library-api/pkg/utils"
	"strings"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type IPlaylistService interface {
	GetPlaylistByID(id string) (*models.Playlist, error)
	GetPlaylists(page, limit int) ([]*models.Playlist, error)
	CreatePlaylist(playlist *models.Playlist) (*models.Playlist, error)
	UpdatePlaylist(playlist *models.Playlist) error
	DeletePlaylist(id string) error
	StreamPlaylistM3U(id string, trackStreamBaseURL string) (string, error)
	CreatePlaylistFormData(playlist *dto.CreatePlaylistRequest, trackIDs []primitive.ObjectID) (*models.Playlist, error)
}

type PlaylistService struct {
	repo           repositories.IPlaylistRepository
	trackService   ITrackService
	CloudinaryUtil *utils.CloudinaryUtil
}

func NewPlaylistService(repo repositories.IPlaylistRepository, trackService ITrackService, cloudinaryUtil *utils.CloudinaryUtil) IPlaylistService {
	return &PlaylistService{
		repo:           repo,
		trackService:   trackService,
		CloudinaryUtil: cloudinaryUtil,
	}
}

func (s *PlaylistService) GetPlaylistByID(id string) (*models.Playlist, error) {
	return s.repo.GetPlaylistByID(id)
}

func (s *PlaylistService) GetPlaylists(page, limit int) ([]*models.Playlist, error) {
	return s.repo.GetPlaylists(page, limit)
}

func (s *PlaylistService) CreatePlaylist(playlist *models.Playlist) (*models.Playlist, error) {
	return s.repo.CreatePlaylist(playlist)
}

func (s *PlaylistService) UpdatePlaylist(playlist *models.Playlist) error {
	return s.repo.UpdatePlaylist(playlist)
}

func (s *PlaylistService) DeletePlaylist(id string) error {
	return s.repo.DeletePlaylist(id)
}

// StreamPlaylistM3U generates the M3U content for a playlist using Extended M3U format.
func (s *PlaylistService) StreamPlaylistM3U(id string, trackStreamBaseURL string) (string, error) {
	id = strings.TrimSuffix(id, ".m3u")

	playlist, err := s.repo.GetPlaylistByID(id)
	if err != nil {
		return "", err
	}

	tracks, err := s.trackService.GetTracksByIDs(playlist.TrackIDs)
	if err != nil {
		return "", fmt.Errorf("failed to retrieve tracks for playlist %s: %w", id, err)
	}

	var m3uContent strings.Builder
	m3uContent.WriteString("#EXTM3U\n")

	baseURL := strings.TrimRight(trackStreamBaseURL, "/")

	for _, track := range tracks {

		// EXTINF
		m3uContent.WriteString(
			fmt.Sprintf("#EXTINF:%d,%s - %s\n", track.Duration, track.Artist, track.Title),
		)

		trackURL := fmt.Sprintf("%s/%s/stream", baseURL, track.ID.Hex())

		m3uContent.WriteString(trackURL + "\n")
	}

	return m3uContent.String(), nil
}

func (s *PlaylistService) CreatePlaylistFormData(playlist *dto.CreatePlaylistRequest, trackIDs []primitive.ObjectID) (*models.Playlist, error) {
	var albumCoverURL string
	var err error

	if playlist.AlbumCover != nil {
		albumCoverURL, err = s.uploadAlbumCover(playlist.AlbumCover)
		if err != nil {
			return nil, fmt.Errorf("failed to upload album cover: %w", err)
		}
	}

	p := &models.Playlist{
		Title:      playlist.Title,
		AlbumCover: albumCoverURL,
		TrackIDs:   trackIDs,
	}

	playlistObj, err := s.repo.CreatePlaylist(p)
	if err != nil {
		return nil, fmt.Errorf("failed to create playlist: %w", err)
	}

	return playlistObj, nil
}

func (s *PlaylistService) uploadAlbumCover(fileHeader *multipart.FileHeader) (string, error) {
	if s.CloudinaryUtil == nil {
		return "", fmt.Errorf("cloudinary util is not configured")
	}

	file, err := fileHeader.Open()
	if err != nil {
		return "", fmt.Errorf("failed to open uploaded file: %w", err)
	}
	defer file.Close()

	url, err := s.CloudinaryUtil.UploadImage(file, fileHeader, "album_covers")
	if err != nil {
		return "", err
	}

	return url, nil
}
