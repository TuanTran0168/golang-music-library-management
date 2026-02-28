package services

import (
	"errors"
	"music-library-api/internal/dto"
	"music-library-api/internal/mappers"
	"music-library-api/internal/models"
	"music-library-api/internal/repositories"
)

type IUserService interface {
	GetAllUsers(page, limit int) ([]dto.UserResponse, error)
	UpdateUserRole(userID string, req *dto.UpdateRoleRequest) (*dto.UserResponse, error)
}

type userService struct {
	userRepo repositories.IUserRepository
}

func NewUserService(userRepo repositories.IUserRepository) IUserService {
	return &userService{userRepo: userRepo}
}

func (s *userService) GetAllUsers(page, limit int) ([]dto.UserResponse, error) {
	users, err := s.userRepo.GetAllUsers(page, limit)
	if err != nil {
		return nil, err
	}

	resp := make([]dto.UserResponse, len(users))
	for i, u := range users {
		resp[i] = mappers.ToUserResponse(u)
	}
	return resp, nil
}

func (s *userService) UpdateUserRole(userID string, req *dto.UpdateRoleRequest) (*dto.UserResponse, error) {
	user, err := s.userRepo.GetUserByID(userID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	validRoles := map[string]bool{
		models.RoleAdmin:  true,
		models.RoleArtist: true,
		models.RoleUser:   true,
	}
	if !validRoles[req.Role] {
		return nil, errors.New("invalid role")
	}

	user.Role = req.Role
	if err := s.userRepo.UpdateUser(user); err != nil {
		return nil, err
	}

	result := mappers.ToUserResponse(user)
	return &result, nil
}
