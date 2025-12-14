package models

import (
	"github.com/kamva/mgm/v3"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type User struct {
	mgm.DefaultModel `bson:",inline"`
	Username         string               `bson:"username" json:"username"`
	Email            string               `bson:"email" json:"email"`
	Password         string               `bson:"password" json:"-"`
	Avatar           string               `bson:"avatar" json:"avatar"`
	Role             Role                 `bson:"role" json:"role"`
	FavoriteTrackIDs []primitive.ObjectID `bson:"favorite_track_ids" json:"favorite_track_ids"`
	PlaylistIDs      []primitive.ObjectID `bson:"playlist_ids" json:"playlist_ids"`
}
