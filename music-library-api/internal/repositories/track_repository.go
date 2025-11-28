package repositories

import (
	"context"
	"music-library-api/internal/models"

	"github.com/kamva/mgm/v3"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type ITrackRepository interface {
	GetTrackByID(id string) (*models.Track, error)
	GetTracks(page, limit int) ([]*models.Track, error)
	CreateTrack(track *models.Track) error
	UpdateTrack(track *models.Track) error
	DeleteTrack(id string) error
	SearchTracks(query string, page, limit int) ([]*models.Track, error)
}

type trackRepository struct{}

func NewTrackRepository() ITrackRepository {
	return &trackRepository{}
}

// Get one track by ID
func (r *trackRepository) GetTrackByID(id string) (*models.Track, error) {
	track := &models.Track{}
	err := mgm.Coll(track).FindByID(id, track)
	if err != nil {
		return nil, err
	}
	return track, nil
}

// Get paginated tracks
func (r *trackRepository) GetTracks(page, limit int) ([]*models.Track, error) {
	tracks := []*models.Track{}
	skip := int64((page - 1) * limit)
	opts := options.Find().SetSkip(skip).SetLimit(int64(limit))
	cursor, err := mgm.Coll(&models.Track{}).Find(context.Background(), bson.M{}, opts)
	if err != nil {
		return nil, err
	}
	if err := cursor.All(context.Background(), &tracks); err != nil {
		return nil, err
	}
	return tracks, nil
}

// Create a new track
func (r *trackRepository) CreateTrack(track *models.Track) error {
	return mgm.Coll(track).Create(track)
}

// Update track
func (r *trackRepository) UpdateTrack(track *models.Track) error {
	return mgm.Coll(track).Update(track)
}

// Delete track
func (r *trackRepository) DeleteTrack(id string) error {
	track := &models.Track{}
	if err := mgm.Coll(track).FindByID(id, track); err != nil {
		return err
	}
	return mgm.Coll(track).Delete(track)
}

// Search tracks by title, artist, album, genre (basic)
func (r *trackRepository) SearchTracks(query string, page, limit int) ([]*models.Track, error) {
	tracks := []*models.Track{}
	skip := int64((page - 1) * limit)
	filter := bson.M{
		"$or": []bson.M{
			{"title": bson.M{"$regex": query, "$options": "i"}},
			{"artist": bson.M{"$regex": query, "$options": "i"}},
			{"album": bson.M{"$regex": query, "$options": "i"}},
			{"genre": bson.M{"$regex": query, "$options": "i"}},
		},
	}
	opts := options.Find().SetSkip(skip).SetLimit(int64(limit))
	cursor, err := mgm.Coll(&models.Track{}).Find(context.Background(), filter, opts)
	if err != nil {
		return nil, err
	}
	if err := cursor.All(context.Background(), &tracks); err != nil {
		return nil, err
	}
	return tracks, nil
}
