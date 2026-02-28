package models

import (
	"github.com/kamva/mgm/v3"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Playlist struct {
	mgm.DefaultModel `bson:",inline"`
	UserID           primitive.ObjectID   `bson:"user_id" json:"user_id"`
	Title            string               `bson:"title" json:"title"`
	AlbumCover       string               `bson:"album_cover" json:"album_cover"` // image URL
	TrackIDs         []primitive.ObjectID `bson:"track_ids" json:"track_ids"`
}
