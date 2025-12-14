package dto

import "time"

type CreateUserRequest struct {
	Username string `json:"username" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Avatar   string `json:"avatar"`
}

type UpdateUserRequest struct {
	Username string `json:"username"`
	Email    string `json:"email" binding:"omitempty,email"`
	Avatar   string `json:"avatar"`
	Role     string `json:"role"`
}

type UserResponse struct {
	ID        string    `json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	Username         string   `json:"username"`
	Email            string   `json:"email"`
	Avatar           string   `json:"avatar"`
	Role             string   `json:"role"`
	FavoriteTrackIDs []string `json:"favorite_track_ids"`
	PlaylistIDs      []string `json:"playlist_ids"`
}

type UserListResponse struct {
	Page  int            `json:"page"`
	Limit int            `json:"limit"`
	Data  []UserResponse `json:"data"`
}
