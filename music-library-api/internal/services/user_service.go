package services

import (
	"fmt"
	"music-library-api/internal/dto"
	"music-library-api/internal/mappers"
	"music-library-api/internal/models"
	"music-library-api/internal/repositories"

	"go.mongodb.org/mongo-driver/bson/primitive"
	"golang.org/x/crypto/bcrypt"
)

type IUserService interface {
	GetUserByID(id string) (*models.User, error)
	GetUsers(page, limit int) ([]*models.User, error)
	CreateUser(req *dto.CreateUserRequest) (*models.User, error)
	UpdateUser(id string, req *dto.UpdateUserRequest) (*models.User, error)
	DeleteUser(id string) error
	AddFavoriteTrack(userID, trackID string) error
	RemoveFavoriteTrack(userID, trackID string) error
}

type UserService struct {
	repo repositories.IUserRepository
}

func NewUserService(repo repositories.IUserRepository) IUserService {
	return &UserService{repo: repo}
}

func (s *UserService) GetUserByID(id string) (*models.User, error) {
	return s.repo.GetUserByID(id)
}

func (s *UserService) GetUsers(page, limit int) ([]*models.User, error) {
	return s.repo.GetUsers(page, limit)
}

func (s *UserService) CreateUser(req *dto.CreateUserRequest) (*models.User, error) {
	// check email uniqueness
	if existing, err := s.repo.FindByEmail(req.Email); err == nil && existing != nil {
		return nil, fmt.Errorf("email already in use")
	}

	user := mappers.ToUserModelFromCreate(req)

	hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}
	user.Password = string(hashed)

	return s.repo.CreateUser(user)
}

func (s *UserService) UpdateUser(id string, req *dto.UpdateUserRequest) (*models.User, error) {
	u, err := s.repo.GetUserByID(id)
	if err != nil {
		return nil, err
	}
	if req.Username != "" {
		u.Username = req.Username
	}
	if req.Email != "" {
		u.Email = req.Email
	}
	if req.Avatar != "" {
		u.Avatar = req.Avatar
	}
	if req.Role != "" {
		u.Role = models.Role(req.Role)
	}

	return s.repo.UpdateUser(u)
}

func (s *UserService) DeleteUser(id string) error {
	return s.repo.DeleteUser(id)
}

func (s *UserService) AddFavoriteTrack(userID, trackID string) error {
	oid, err := primitive.ObjectIDFromHex(trackID)
	if err != nil {
		return err
	}
	return s.repo.AddFavoriteTrack(userID, oid)
}

func (s *UserService) RemoveFavoriteTrack(userID, trackID string) error {
	oid, err := primitive.ObjectIDFromHex(trackID)
	if err != nil {
		return err
	}
	return s.repo.RemoveFavoriteTrack(userID, oid)
}
