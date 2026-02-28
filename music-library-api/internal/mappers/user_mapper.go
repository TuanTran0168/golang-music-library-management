package mappers

import (
	"music-library-api/internal/dto"
	"music-library-api/internal/models"
)

func ToUserResponse(m *models.User) dto.UserResponse {
	return dto.UserResponse{
		ID:        m.ID.Hex(),
		CreatedAt: m.CreatedAt,
		UpdatedAt: m.UpdatedAt,
		Name:      m.Name,
		Email:     m.Email,
		Role:      m.Role,
	}
}
