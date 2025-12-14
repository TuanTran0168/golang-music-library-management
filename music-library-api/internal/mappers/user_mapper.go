package mappers

import (
	"music-library-api/internal/dto"
	"music-library-api/internal/models"
)

func ToUserResponse(u *models.User) dto.UserResponse {
	fav := make([]string, 0)
	for _, id := range u.FavoriteTrackIDs {
		fav = append(fav, id.Hex())
	}
	pls := make([]string, 0)
	for _, id := range u.PlaylistIDs {
		pls = append(pls, id.Hex())
	}

	return dto.UserResponse{
		ID:               u.ID.Hex(),
		CreatedAt:        u.CreatedAt,
		UpdatedAt:        u.UpdatedAt,
		Username:         u.Username,
		Email:            u.Email,
		Avatar:           u.Avatar,
		Role:             string(u.Role),
		FavoriteTrackIDs: fav,
		PlaylistIDs:      pls,
	}
}

func ToUserModelFromCreate(req *dto.CreateUserRequest) *models.User {
	return &models.User{
		Username: req.Username,
		Email:    req.Email,
		Avatar:   req.Avatar,
		Role:     models.RoleUser,
	}
}
