package repositories

import (
	"context"
	"music-library-api/internal/models"

	"github.com/kamva/mgm/v3"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type ITrackRepository interface {
	GetTrackByID(id string) (*models.Track, error)
	GetTracks(page, limit int, userID string) ([]*models.Track, error)
	CountTracks(userID string) (int64, error)
	CreateTrack(track *models.Track) error
	UpdateTrack(track *models.Track) error
	DeleteTrack(id string) error
	SearchTracks(query string, page, limit int, userID string) ([]*models.Track, error)
	CountSearchTracks(query string, userID string) (int64, error)
	GetTracksByIDs(ids []primitive.ObjectID) ([]*models.Track, error)
	FindMissingIDs(ids []primitive.ObjectID) ([]primitive.ObjectID, error)
	ExistAllByIDs(ids []primitive.ObjectID) (bool, error)
}

type trackRepository struct {
	Collection *mongo.Collection
}

func NewTrackRepository(db *mongo.Database) ITrackRepository {
	return &trackRepository{
		Collection: db.Collection("tracks"),
	}
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
func (r *trackRepository) GetTracks(page, limit int, userID string) ([]*models.Track, error) {
	tracks := []*models.Track{}
	skip := int64((page - 1) * limit)
	opts := options.Find().SetSkip(skip).SetLimit(int64(limit))

	filter := bson.M{}
	if userID != "" {
		objID, err := primitive.ObjectIDFromHex(userID)
		if err == nil {
			filter["user_id"] = objID
		}
	}

	cursor, err := mgm.Coll(&models.Track{}).Find(context.Background(), filter, opts)
	if err != nil {
		return nil, err
	}
	if err := cursor.All(context.Background(), &tracks); err != nil {
		return nil, err
	}
	return tracks, nil
}

func (r *trackRepository) CountTracks(userID string) (int64, error) {
	filter := bson.M{}
	if userID != "" {
		objID, err := primitive.ObjectIDFromHex(userID)
		if err == nil {
			filter["user_id"] = objID
		}
	}
	return mgm.Coll(&models.Track{}).CountDocuments(context.Background(), filter)
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
func (r *trackRepository) SearchTracks(query string, page, limit int, userID string) ([]*models.Track, error) {
	tracks := []*models.Track{}
	skip := int64((page - 1) * limit)

	searchFilter := bson.M{
		"$or": []bson.M{
			{"title": bson.M{"$regex": query, "$options": "i"}},
			{"artist": bson.M{"$regex": query, "$options": "i"}},
			{"album": bson.M{"$regex": query, "$options": "i"}},
			{"genre": bson.M{"$regex": query, "$options": "i"}},
		},
	}

	filter := searchFilter
	if userID != "" {
		objID, err := primitive.ObjectIDFromHex(userID)
		if err == nil {
			filter = bson.M{
				"$and": []bson.M{
					{"user_id": objID},
					searchFilter,
				},
			}
		}
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

func (r *trackRepository) CountSearchTracks(query string, userID string) (int64, error) {
	searchFilter := bson.M{
		"$or": []bson.M{
			{"title": bson.M{"$regex": query, "$options": "i"}},
			{"artist": bson.M{"$regex": query, "$options": "i"}},
			{"album": bson.M{"$regex": query, "$options": "i"}},
			{"genre": bson.M{"$regex": query, "$options": "i"}},
		},
	}

	filter := searchFilter
	if userID != "" {
		objID, err := primitive.ObjectIDFromHex(userID)
		if err == nil {
			filter = bson.M{
				"$and": []bson.M{
					{"user_id": objID},
					searchFilter,
				},
			}
		}
	}

	return mgm.Coll(&models.Track{}).CountDocuments(context.Background(), filter)
}

func (r *trackRepository) GetTracksByIDs(ids []primitive.ObjectID) ([]*models.Track, error) {
	if len(ids) == 0 {
		return []*models.Track{}, nil
	}

	filter := bson.M{"_id": bson.M{"$in": ids}}

	cursor, err := r.Collection.Find(context.Background(), filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.Background())

	var tracks []*models.Track
	for cursor.Next(context.Background()) {
		var t models.Track
		if err := cursor.Decode(&t); err != nil {
			return nil, err
		}
		tracks = append(tracks, &t)
	}

	if err := cursor.Err(); err != nil {
		return nil, err
	}

	return tracks, nil
}

func (r *trackRepository) FindMissingIDs(ids []primitive.ObjectID) ([]primitive.ObjectID, error) {
	cursor, err := r.Collection.Find(context.Background(), bson.M{"_id": bson.M{"$in": ids}})
	if err != nil {
		return nil, err
	}
	var existing []models.Track
	if err := cursor.All(context.Background(), &existing); err != nil {
		return nil, err
	}

	existingMap := make(map[primitive.ObjectID]struct{})
	for _, t := range existing {
		existingMap[t.ID] = struct{}{}
	}

	var missing []primitive.ObjectID
	for _, id := range ids {
		if _, ok := existingMap[id]; !ok {
			missing = append(missing, id)
		}
	}
	return missing, nil
}

func (r *trackRepository) ExistAllByIDs(ids []primitive.ObjectID) (bool, error) {
	count, err := r.Collection.CountDocuments(context.Background(), bson.M{"_id": bson.M{"$in": ids}})
	if err != nil {
		return false, err
	}
	return count == int64(len(ids)), nil
}
