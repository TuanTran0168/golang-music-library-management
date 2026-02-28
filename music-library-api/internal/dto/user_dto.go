package dto

import "time"

type UserResponse struct {
	ID        string    `json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
}

type UpdateRoleRequest struct {
	Role string `json:"role" binding:"required,oneof=admin artist user"`
}
