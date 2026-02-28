package handlers

import (
	"net/http"
	"strconv"

	"music-library-api/internal/dto"
	"music-library-api/internal/services"

	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	service services.IUserService
}

func NewUserHandler(service services.IUserService) *UserHandler {
	return &UserHandler{service: service}
}

// @Summary      Get all users (Admin only)
// @Description  Retrieve a paginated list of all users
// @Tags         Users
// @Accept       json
// @Produce      json
// @Param        page  query int false "Page number"
// @Param        limit query int false "Page size"
// @Success      200 {object} map[string]interface{}
// @Failure      500 {object} map[string]string
// @Security     BearerAuth
// @Router       /users [get]
func (h *UserHandler) GetAllUsers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	users, err := h.service.GetAllUsers(page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"page":  page,
		"limit": limit,
		"data":  users,
	})
}

// @Summary      Update user role (Admin only)
// @Description  Update a user's role by their ID
// @Tags         Users
// @Accept       json
// @Produce      json
// @Param        id   path string true "User ID"
// @Param        body body dto.UpdateRoleRequest true "New role"
// @Success      200 {object} dto.UserResponse
// @Failure      400 {object} map[string]string
// @Failure      404 {object} map[string]string
// @Security     BearerAuth
// @Router       /users/{id}/role [patch]
func (h *UserHandler) UpdateUserRole(c *gin.Context) {
	userID := c.Param("id")

	var req dto.UpdateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.service.UpdateUserRole(userID, &req)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, user)
}
