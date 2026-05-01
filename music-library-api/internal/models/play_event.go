package models

import (
	"github.com/kamva/mgm/v3"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type PlayEvent struct {
	mgm.DefaultModel `bson:",inline"`
	UserID           *primitive.ObjectID `bson:"user_id" json:"user_id"` // nil = guest
	TrackID          primitive.ObjectID  `bson:"track_id" json:"track_id"`
}

func (p *PlayEvent) CollectionName() string {
	return "play_events"
}
