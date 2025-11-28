package repositories

import (
	"context"
	"music-library-api/internal/models"

	"github.com/kamva/mgm/v3"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type IPlaylistRepository interface {
	GetPlaylistByID(id string) (*models.Playlist, error)
	GetPlaylists(page, limit int) ([]*models.Playlist, error)
	CreatePlaylist(playlist *models.Playlist) error
	UpdatePlaylist(playlist *models.Playlist) error
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

func (r *playlistRepository) GetPlaylists(page, limit int) ([]*models.Playlist, error) {
	playlists := []*models.Playlist{}
	skip := int64((page - 1) * limit)
	opts := options.Find().SetSkip(skip).SetLimit(int64(limit))
	cursor, err := mgm.Coll(&models.Playlist{}).Find(context.Background(), bson.M{}, opts)
	if err != nil {
		return nil, err
	}
	if err := cursor.All(context.Background(), &playlists); err != nil {
		return nil, err
	}
	return playlists, nil
}

func (r *playlistRepository) CreatePlaylist(playlist *models.Playlist) error {
	return mgm.Coll(playlist).Create(playlist)
}

func (r *playlistRepository) UpdatePlaylist(playlist *models.Playlist) error {
	return mgm.Coll(playlist).Update(playlist)
}

func (r *playlistRepository) DeletePlaylist(id string) error {
	playlist := &models.Playlist{}
	if err := mgm.Coll(playlist).FindByID(id, playlist); err != nil {
		return err
	}
	return mgm.Coll(playlist).Delete(playlist)
}
