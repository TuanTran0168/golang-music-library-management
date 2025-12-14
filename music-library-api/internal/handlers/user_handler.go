package handlers

import (
	"net/http"
	"strconv"

	"music-library-api/internal/dto"
	"music-library-api/internal/mappers"
	"music-library-api/internal/services"

	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	service services.IUserService
}

func NewUserHandler(s services.IUserService) *UserHandler {
	return &UserHandler{service: s}
}

// GetUsers godoc
// @Summary Get list of users
// @Tags users
// @Produce json
// @Success 200 {object} dto.UserListResponse
// @Failure 500 {object} map[string]string
// @Router /users [get]
func (h *UserHandler) GetUsers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	list, err := h.service.GetUsers(page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	resp := make([]dto.UserResponse, 0)
	for _, u := range list {
		resp = append(resp, mappers.ToUserResponse(u))
	}

	c.JSON(http.StatusOK, dto.UserListResponse{Page: page, Limit: limit, Data: resp})
}

// GetUserByID godoc
// @Summary Get user by ID
// @Tags users
// @Produce json
// @Param id path string true "User ID"
// @Success 200 {object} dto.UserResponse
// @Failure 404 {object} map[string]string
// @Router /users/{id} [get]
func (h *UserHandler) GetUserByID(c *gin.Context) {
	id := c.Param("id")
	u, err := h.service.GetUserByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}
	c.JSON(http.StatusOK, mappers.ToUserResponse(u))
}

// CreateUser godoc
// @Summary Create user
// @Tags users
// @Accept json
// @Produce json
// @Param user body dto.CreateUserRequest true "User"
// @Success 201 {object} dto.UserResponse
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /users [post]
func (h *UserHandler) CreateUser(c *gin.Context) {
	var req dto.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.service.CreateUser(&req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, mappers.ToUserResponse(user))
}

// UpdateUser godoc
// @Summary Update user
// @Tags users
// @Accept json
// @Produce json
// @Param id path string true "User ID"
// @Param user body dto.UpdateUserRequest true "User"
// @Success 200 {object} dto.UserResponse
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /users/{id} [patch]
func (h *UserHandler) UpdateUser(c *gin.Context) {
	id := c.Param("id")
	var req dto.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	u, err := h.service.UpdateUser(id, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, mappers.ToUserResponse(u))
}

// DeleteUser godoc
// @Summary Delete user
// @Tags users
// @Param id path string true "User ID"
// @Success 204
// @Failure 404 {object} map[string]string
// @Router /users/{id} [delete]
func (h *UserHandler) DeleteUser(c *gin.Context) {
	id := c.Param("id")
	if err := h.service.DeleteUser(id); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

// Favorite endpoints
// POST /users/:id/favorites/:trackId
func (h *UserHandler) AddFavoriteTrack(c *gin.Context) {
	id := c.Param("id")
	trackID := c.Param("trackId")
	if err := h.service.AddFavoriteTrack(id, trackID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *UserHandler) RemoveFavoriteTrack(c *gin.Context) {
	id := c.Param("id")
	trackID := c.Param("trackId")
	if err := h.service.RemoveFavoriteTrack(id, trackID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}
