package models

import (
	"github.com/kamva/mgm/v3"
)

const (
	RoleAdmin  = "admin"
	RoleArtist = "artist"
	RoleUser   = "user"
)

type User struct {
	mgm.DefaultModel `bson:",inline"`
	Name             string `bson:"name" json:"name"`
	Email            string `bson:"email" json:"email"`
	Password         string `bson:"password" json:"-"`
	Role             string `bson:"role" json:"role"` // admin, artist, user
}
