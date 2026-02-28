package services

import (
	"errors"
	"fmt"
	config "music-library-api/configs"
	"music-library-api/internal/dto"
	"music-library-api/internal/models"
	"music-library-api/internal/repositories"
	"music-library-api/pkg/utils"

	"golang.org/x/crypto/bcrypt"
)

type IAuthService interface {
	Register(req *dto.RegisterRequest) (*dto.AuthResponse, error)
	Login(req *dto.LoginRequest) (*dto.AuthResponse, error)
}

type authService struct {
	userRepo repositories.IUserRepository
	cfg      *config.Config
}

func NewAuthService(userRepo repositories.IUserRepository, cfg *config.Config) IAuthService {
	return &authService{
		userRepo: userRepo,
		cfg:      cfg,
	}
}

func (s *authService) Register(req *dto.RegisterRequest) (*dto.AuthResponse, error) {
	existingUser, _ := s.userRepo.GetUserByEmail(req.Email)
	if existingUser != nil {
		return nil, errors.New("email already in use")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	role := models.RoleUser
	fmt.Println(req.RoleKey)
	fmt.Println(s.cfg.AdminRoleKey)
	if req.RoleKey != "" && req.RoleKey == s.cfg.AdminRoleKey {
		role = models.RoleAdmin
	}

	user := &models.User{
		Name:     req.Name,
		Email:    req.Email,
		Password: string(hashedPassword),
		Role:     role,
	}

	if err := s.userRepo.CreateUser(user); err != nil {
		return nil, err
	}

	secret := s.cfg.JWTSecret
	if secret == "" {
		secret = "default-secret"
	}
	token, err := utils.GenerateJWT(user.ID.Hex(), user.Role, secret, s.cfg.JWTExpiration)
	if err != nil {
		return nil, err
	}

	return &dto.AuthResponse{
		Token: token,
		User: dto.UserResponse{
			ID:        user.ID.Hex(),
			CreatedAt: user.CreatedAt,
			UpdatedAt: user.UpdatedAt,
			Name:      user.Name,
			Email:     user.Email,
			Role:      user.Role,
		},
	}, nil
}

func (s *authService) Login(req *dto.LoginRequest) (*dto.AuthResponse, error) {
	user, err := s.userRepo.GetUserByEmail(req.Email)
	if err != nil || user == nil {
		return nil, errors.New("invalid email or password")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return nil, errors.New("invalid email or password")
	}

	secret := s.cfg.JWTSecret
	if secret == "" {
		secret = "default-secret"
	}
	token, err := utils.GenerateJWT(user.ID.Hex(), user.Role, secret, s.cfg.JWTExpiration)
	if err != nil {
		return nil, err
	}

	return &dto.AuthResponse{
		Token: token,
		User: dto.UserResponse{
			ID:        user.ID.Hex(),
			CreatedAt: user.CreatedAt,
			UpdatedAt: user.UpdatedAt,
			Name:      user.Name,
			Email:     user.Email,
			Role:      user.Role,
		},
	}, nil
}
