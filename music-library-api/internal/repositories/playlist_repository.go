package repositories

import (
	"context"
	"music-library-api/internal/models"

	"github.com/kamva/mgm/v3"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type IPlaylistRepository interface {
	GetPlaylistByID(id string) (*models.Playlist, error)
	GetPlaylists(page, limit int, userID string) ([]*models.Playlist, error)
	CountPlaylists(userID string) (int64, error)
	CreatePlaylist(playlist *models.Playlist) (*models.Playlist, error)
	UpdatePlaylist(playlist *models.Playlist) (*models.Playlist, error)
	DeletePlaylist(id string) error
}

type playlistRepository struct{}

func NewPlaylistRepository() IPlaylistRepository {
	return &playlistRepository{}
}

func (r *playlistRepository) GetPlaylistByID(id string) (*models.Playlist, error) {
	playlist := &models.Playlist{}
	if err := mgm.Coll(playlist).FindByID(id, playlist); err != nil {
		return nil, err
	}
	return playlist, nil
}

func (r *playlistRepository) GetPlaylists(page, limit int, userID string) ([]*models.Playlist, error) {
	playlists := []*models.Playlist{}
	skip := int64((page - 1) * limit)
	opts := options.Find().SetSkip(skip).SetLimit(int64(limit))

	filter := bson.M{}
	if userID != "" {
		objID, err := primitive.ObjectIDFromHex(userID)
		if err == nil {
			filter["user_id"] = objID
		}
	}

	cursor, err := mgm.Coll(&models.Playlist{}).Find(context.Background(), filter, opts)
	if err != nil {
		return nil, err
	}
	if err := cursor.All(context.Background(), &playlists); err != nil {
		return nil, err
	}
	return playlists, nil
}

func (r *playlistRepository) CountPlaylists(userID string) (int64, error) {
	filter := bson.M{}
	if userID != "" {
		objID, err := primitive.ObjectIDFromHex(userID)
		if err == nil {
			filter["user_id"] = objID
		}
	}
	return mgm.Coll(&models.Playlist{}).CountDocuments(context.Background(), filter)
}

func (r *playlistRepository) CreatePlaylist(playlist *models.Playlist) (*models.Playlist, error) {
	return playlist, mgm.Coll(playlist).Create(playlist)
}

func (r *playlistRepository) UpdatePlaylist(playlist *models.Playlist) (*models.Playlist, error) {
	return playlist, mgm.Coll(playlist).Update(playlist)
}

func (r *playlistRepository) DeletePlaylist(id string) error {
	playlist := &models.Playlist{}
	if err := mgm.Coll(playlist).FindByID(id, playlist); err != nil {
		return err
	}
	return mgm.Coll(playlist).Delete(playlist)
}
