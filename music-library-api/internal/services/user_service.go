package services

import (
	"errors"
	"music-library-api/internal/dto"
	"music-library-api/internal/mappers"
	"music-library-api/internal/models"
	"music-library-api/internal/repositories"

	"golang.org/x/crypto/bcrypt"
)

type IUserService interface {
	GetAllUsers(page, limit int) ([]dto.UserResponse, int64, error)
	GetUserByID(userID string) (*dto.UserResponse, error)
	UpdateUserRole(userID string, req *dto.UpdateRoleRequest) (*dto.UserResponse, error)
	UpdateUserInfo(userID string, req *dto.UpdateUserInfoRequest) (*dto.UserResponse, error)
	ChangePassword(userID string, req *dto.ChangePasswordRequest) error
}

type userService struct {
	userRepo repositories.IUserRepository
}

func NewUserService(userRepo repositories.IUserRepository) IUserService {
	return &userService{userRepo: userRepo}
}

func (s *userService) GetAllUsers(page, limit int) ([]dto.UserResponse, int64, error) {
	users, err := s.userRepo.GetAllUsers(page, limit)
	if err != nil {
		return nil, 0, err
	}

	total, err := s.userRepo.CountUsers()
	if err != nil {
		return nil, 0, err
	}

	resp := make([]dto.UserResponse, len(users))
	for i, u := range users {
		resp[i] = mappers.ToUserResponse(u)
	}
	return resp, total, nil
}

func (s *userService) GetUserByID(userID string) (*dto.UserResponse, error) {
	user, err := s.userRepo.GetUserByID(userID)
	if err != nil || user == nil {
		return nil, errors.New("user not found")
	}
	res := mappers.ToUserResponse(user)
	return &res, nil
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

func (s *userService) UpdateUserInfo(userID string, req *dto.UpdateUserInfoRequest) (*dto.UserResponse, error) {
	user, err := s.userRepo.GetUserByID(userID)
	if err != nil || user == nil {
		return nil, errors.New("user not found")
	}

	user.Name = req.Name
	user.Email = req.Email
	if err := s.userRepo.UpdateUser(user); err != nil {
		return nil, err
	}

	result := mappers.ToUserResponse(user)
	return &result, nil
}

func (s *userService) ChangePassword(userID string, req *dto.ChangePasswordRequest) error {
	user, err := s.userRepo.GetUserByID(userID)
	if err != nil || user == nil {
		return errors.New("user not found")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.CurrentPassword)); err != nil {
		return errors.New("current password is incorrect")
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	user.Password = string(hashed)
	return s.userRepo.UpdateUser(user)
}
