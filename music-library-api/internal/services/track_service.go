package services

import (
	"io"
	"music-library-api/internal/models"
	"music-library-api/internal/repositories"

	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/gridfs"
)

type ITrackService interface {
	GetTrackByID(id string) (*models.Track, error)
	GetTracks(page, limit int) ([]*models.Track, error)
	CreateTrack(track *models.Track) error
	UpdateTrack(track *models.Track) error
	DeleteTrack(id string) error
	SearchTracks(query string, page, limit int) ([]*models.Track, error)
	UploadMP3ToGridFS(filename string, r io.Reader) (primitive.ObjectID, error)
}

type TrackService struct {
	repo    repositories.ITrackRepository
	mongodb *mongo.Database
}

func NewTrackService(repo repositories.ITrackRepository, mongodb *mongo.Database) ITrackService {
	return &TrackService{
		repo:    repo,
		mongodb: mongodb,
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

func (s *TrackService) UploadMP3ToGridFS(filename string, r io.Reader) (primitive.ObjectID, error) {

	bucket, err := gridfs.NewBucket(s.mongodb)
	if err != nil {
		return primitive.NilObjectID, err
	}

	fileID, err := bucket.UploadFromStream(filename, r)
	if err != nil {
		return primitive.NilObjectID, err
	}
	return fileID, nil
}
