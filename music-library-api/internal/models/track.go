package models

import (
	"github.com/kamva/mgm/v3"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Track struct {
	mgm.DefaultModel `bson:",inline"`   // ID, CreatedAt, UpdatedAt
	Title            string             `bson:"title" json:"title"`
	Artist           string             `bson:"artist" json:"artist"`
	Album            string             `bson:"album" json:"album"`
	Genre            string             `bson:"genre" json:"genre"`
	ReleaseYear      int                `bson:"release_year" json:"release_year"`
	Duration         int                `bson:"duration" json:"duration"` // in seconds
	URL              string             `bson:"url" json:"url"`           // mp3 URL
	PlaylistID       primitive.ObjectID `bson:"playlist_id,omitempty" json:"playlist_id"`
}
