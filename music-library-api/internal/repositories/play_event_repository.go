package repositories

import (
	"context"
	"time"

	"music-library-api/internal/models"

	"github.com/kamva/mgm/v3"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type HistoryWithTrack struct {
	EventID  primitive.ObjectID `bson:"_id"`
	PlayedAt time.Time          `bson:"created_at"`
	Track    models.Track       `bson:"track"`
}

type TopTrackResult struct {
	TrackID   primitive.ObjectID `bson:"_id"`
	PlayCount int64              `bson:"play_count"`
	Track     models.Track       `bson:"track"`
}

type GenreResult struct {
	Genre     string `bson:"_id"`
	PlayCount int64  `bson:"play_count"`
}

type IPlayEventRepository interface {
	Create(event *models.PlayEvent) error
	GetHistoryWithTracks(userID primitive.ObjectID, page, limit int) ([]HistoryWithTrack, error)
	CountHistory(userID primitive.ObjectID) (int64, error)
	GetTopTracks(limit int) ([]TopTrackResult, error)
	GetUserTopTracks(userID primitive.ObjectID, limit int) ([]TopTrackResult, error)
	CountTotalPlays() (int64, error)
	CountUserPlays(userID primitive.ObjectID) (int64, error)
	GetTrackPlayCount(trackID primitive.ObjectID) (int64, error)
	GetTopGenres(limit int) ([]GenreResult, error)
}

type playEventRepository struct {
	Collection *mongo.Collection
}

func NewPlayEventRepository(db *mongo.Database) IPlayEventRepository {
	return &playEventRepository{
		Collection: db.Collection("play_events"),
	}
}

func (r *playEventRepository) Create(event *models.PlayEvent) error {
	return mgm.Coll(event).Create(event)
}

func (r *playEventRepository) GetHistoryWithTracks(userID primitive.ObjectID, page, limit int) ([]HistoryWithTrack, error) {
	skip := int64((page - 1) * limit)
	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.D{{Key: "user_id", Value: userID}}}},
		{{Key: "$sort", Value: bson.D{{Key: "created_at", Value: -1}}}},
		{{Key: "$skip", Value: skip}},
		{{Key: "$limit", Value: int64(limit)}},
		{{Key: "$lookup", Value: bson.D{
			{Key: "from", Value: "tracks"},
			{Key: "localField", Value: "track_id"},
			{Key: "foreignField", Value: "_id"},
			{Key: "as", Value: "track"},
		}}},
		{{Key: "$unwind", Value: "$track"}},
	}

	cursor, err := r.Collection.Aggregate(context.Background(), pipeline)
	if err != nil {
		return nil, err
	}
	var results []HistoryWithTrack
	if err := cursor.All(context.Background(), &results); err != nil {
		return nil, err
	}
	return results, nil
}

func (r *playEventRepository) CountHistory(userID primitive.ObjectID) (int64, error) {
	return r.Collection.CountDocuments(context.Background(), bson.M{"user_id": userID})
}

func (r *playEventRepository) GetTopTracks(limit int) ([]TopTrackResult, error) {
	pipeline := mongo.Pipeline{
		{{Key: "$group", Value: bson.D{
			{Key: "_id", Value: "$track_id"},
			{Key: "play_count", Value: bson.D{{Key: "$sum", Value: 1}}},
		}}},
		{{Key: "$sort", Value: bson.D{{Key: "play_count", Value: -1}}}},
		{{Key: "$limit", Value: int64(limit)}},
		{{Key: "$lookup", Value: bson.D{
			{Key: "from", Value: "tracks"},
			{Key: "localField", Value: "_id"},
			{Key: "foreignField", Value: "_id"},
			{Key: "as", Value: "track"},
		}}},
		{{Key: "$unwind", Value: "$track"}},
	}

	cursor, err := r.Collection.Aggregate(context.Background(), pipeline)
	if err != nil {
		return nil, err
	}
	var results []TopTrackResult
	if err := cursor.All(context.Background(), &results); err != nil {
		return nil, err
	}
	return results, nil
}

func (r *playEventRepository) GetUserTopTracks(userID primitive.ObjectID, limit int) ([]TopTrackResult, error) {
	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.D{{Key: "user_id", Value: userID}}}},
		{{Key: "$group", Value: bson.D{
			{Key: "_id", Value: "$track_id"},
			{Key: "play_count", Value: bson.D{{Key: "$sum", Value: 1}}},
		}}},
		{{Key: "$sort", Value: bson.D{{Key: "play_count", Value: -1}}}},
		{{Key: "$limit", Value: int64(limit)}},
		{{Key: "$lookup", Value: bson.D{
			{Key: "from", Value: "tracks"},
			{Key: "localField", Value: "_id"},
			{Key: "foreignField", Value: "_id"},
			{Key: "as", Value: "track"},
		}}},
		{{Key: "$unwind", Value: "$track"}},
	}

	cursor, err := r.Collection.Aggregate(context.Background(), pipeline)
	if err != nil {
		return nil, err
	}
	var results []TopTrackResult
	if err := cursor.All(context.Background(), &results); err != nil {
		return nil, err
	}
	return results, nil
}

func (r *playEventRepository) CountTotalPlays() (int64, error) {
	return r.Collection.CountDocuments(context.Background(), bson.M{})
}

func (r *playEventRepository) CountUserPlays(userID primitive.ObjectID) (int64, error) {
	return r.Collection.CountDocuments(context.Background(), bson.M{"user_id": userID})
}

func (r *playEventRepository) GetTrackPlayCount(trackID primitive.ObjectID) (int64, error) {
	return r.Collection.CountDocuments(context.Background(), bson.M{"track_id": trackID})
}

func (r *playEventRepository) GetTopGenres(limit int) ([]GenreResult, error) {
	pipeline := mongo.Pipeline{
		{{Key: "$lookup", Value: bson.D{
			{Key: "from", Value: "tracks"},
			{Key: "localField", Value: "track_id"},
			{Key: "foreignField", Value: "_id"},
			{Key: "as", Value: "track"},
		}}},
		{{Key: "$unwind", Value: "$track"}},
		{{Key: "$match", Value: bson.D{{Key: "track.genre", Value: bson.D{{Key: "$ne", Value: ""}}}}}},
		{{Key: "$group", Value: bson.D{
			{Key: "_id", Value: "$track.genre"},
			{Key: "play_count", Value: bson.D{{Key: "$sum", Value: 1}}},
		}}},
		{{Key: "$sort", Value: bson.D{{Key: "play_count", Value: -1}}}},
		{{Key: "$limit", Value: int64(limit)}},
	}

	cursor, err := r.Collection.Aggregate(context.Background(), pipeline)
	if err != nil {
		return nil, err
	}
	var results []GenreResult
	if err := cursor.All(context.Background(), &results); err != nil {
		return nil, err
	}

	return results, nil
}
