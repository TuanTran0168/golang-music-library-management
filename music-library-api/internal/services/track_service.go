package services

import (
	"fmt"
	"io"
	"music-library-api/internal/models"
	"music-library-api/internal/repositories"
	"strconv"
	"strings"

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

	// stream
	OpenTrackStream(fileID primitive.ObjectID, rangeHeader string) (*TrackStream, error)
	GetTracksByIDs(ids []primitive.ObjectID) ([]*models.Track, error)
}

type TrackService struct {
	repo    repositories.ITrackRepository
	mongodb *mongo.Database
}

type TrackStream struct {
	Reader       io.ReadCloser
	Start        int64
	End          int64
	TotalSize    int64
	ContentRange string
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

// Upload MP3 file to GridFS
func (s *TrackService) UploadMP3ToGridFS(filename string, r io.Reader) (primitive.ObjectID, error) {
	bucket, err := gridfs.NewBucket(s.mongodb)
	if err != nil {
		return primitive.NilObjectID, err
	}
	return bucket.UploadFromStream(filename, r)
}

// OpenTrackStream open GridFS file stream, and parse Range header
func (s *TrackService) OpenTrackStream(fileID primitive.ObjectID, rangeHeader string) (*TrackStream, error) {

	bucket, err := gridfs.NewBucket(s.mongodb)
	if err != nil {
		return nil, err
	}

	reader, err := bucket.OpenDownloadStream(fileID)
	if err != nil {
		return nil, err
	}

	fileInfo := reader.GetFile()
	totalSize := fileInfo.Length

	var start int64 = 0
	var end int64 = totalSize - 1 // default: stream full file

	// Parse Range header
	if rangeHeader != "" && strings.HasPrefix(rangeHeader, "bytes=") {

		parts := strings.Split(strings.TrimPrefix(rangeHeader, "bytes="), "-")

		// Parse start
		if parts[0] != "" {
			if v, err := strconv.ParseInt(parts[0], 10, 64); err == nil {
				start = v
			}
		}

		// Parse end
		if len(parts) > 1 && parts[1] != "" {
			if v, err := strconv.ParseInt(parts[1], 10, 64); err == nil {
				end = v
			}
		}

		// Clamp end
		if end >= totalSize {
			end = totalSize - 1
		}

		// If range is out of file -> see as invalid
		if start < 0 || start >= totalSize || end < start {
			reader.Close()
			return nil, fmt.Errorf("invalid range")
		}

		// Skip to start by io.CopyN
		if start > 0 {
			if _, err := io.CopyN(io.Discard, reader, start); err != nil {
				reader.Close()
				return nil, fmt.Errorf("failed to skip bytes: %w", err)
			}
		}
	}

	contentRange := fmt.Sprintf("bytes %d-%d/%d", start, end, totalSize)

	return &TrackStream{
		Reader:       reader,
		Start:        start,
		End:          end,
		TotalSize:    totalSize,
		ContentRange: contentRange,
	}, nil
}

func (s *TrackService) GetTracksByIDs(ids []primitive.ObjectID) ([]*models.Track, error) {
	return s.repo.GetTracksByIDs(ids)
}
