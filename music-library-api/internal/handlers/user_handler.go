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

// GetAllUsers godoc
// @Summary      List all users
// @Description  Admin only — get paginated list of all users
// @Tags         users
// @Produce      json
// @Param        page   query     int  false  "Page number"
// @Param        limit  query     int  false  "Page size"
// @Success      200    {object}  map[string]interface{}
// @Failure      500    {object}  map[string]string
// @Security     BearerAuth
// @Router       /users [get]
func (h *UserHandler) GetAllUsers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	users, total, err := h.service.GetAllUsers(page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"page":        page,
		"limit":       limit,
		"total_count": total,
		"data":        users,
	})
}

// GetUserByID godoc
// @Summary      Get user by ID
// @Description  Admin only — get a single user by ID
// @Tags         users
// @Produce      json
// @Param        id   path      string  true  "User ID"
// @Success      200  {object}  dto.UserResponse
// @Failure      404  {object}  map[string]string
// @Security     BearerAuth
// @Router       /users/{id} [get]
func (h *UserHandler) GetUserByID(c *gin.Context) {
	userID := c.Param("id")
	user, err := h.service.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, user)
}

// UpdateUserRole godoc
// @Summary      Update user role
// @Description  Admin only — change a user's role
// @Tags         users
// @Accept       json
// @Produce      json
// @Param        id    path      string                true  "User ID"
// @Param        body  body      dto.UpdateRoleRequest true  "New role"
// @Success      200   {object}  dto.UserResponse
// @Failure      400   {object}  map[string]string
// @Failure      404   {object}  map[string]string
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

// UpdateUserInfo godoc
// @Summary      Update user info
// @Description  Admin only — update any user's name and email
// @Tags         users
// @Accept       json
// @Produce      json
// @Param        id    path      string                    true  "User ID"
// @Param        body  body      dto.UpdateUserInfoRequest true  "User info"
// @Success      200   {object}  dto.UserResponse
// @Failure      400   {object}  map[string]string
// @Failure      404   {object}  map[string]string
// @Security     BearerAuth
// @Router       /users/{id}/info [patch]
func (h *UserHandler) UpdateUserInfo(c *gin.Context) {
	userID := c.Param("id")

	var req dto.UpdateUserInfoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.service.UpdateUserInfo(userID, &req)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, user)
}

// GetMe godoc
// @Summary      Get current user
// @Description  Get the profile of the currently authenticated user
// @Tags         users
// @Produce      json
// @Success      200  {object}  dto.UserResponse
// @Failure      404  {object}  map[string]string
// @Security     BearerAuth
// @Router       /users/me [get]
func (h *UserHandler) GetMe(c *gin.Context) {
	userID, _ := c.Get("user_id")
	user, err := h.service.GetUserByID(userID.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, user)
}

// UpdateMe godoc
// @Summary      Update current user
// @Description  Update the authenticated user's own name and email
// @Tags         users
// @Accept       json
// @Produce      json
// @Param        body  body      dto.UpdateUserInfoRequest  true  "User info"
// @Success      200   {object}  dto.UserResponse
// @Failure      400   {object}  map[string]string
// @Security     BearerAuth
// @Router       /users/me [patch]
func (h *UserHandler) UpdateMe(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var req dto.UpdateUserInfoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.service.UpdateUserInfo(userID.(string), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, user)
}

// ChangePassword godoc
// @Summary      Change password
// @Description  Change the authenticated user's own password
// @Tags         users
// @Accept       json
// @Produce      json
// @Param        body  body      dto.ChangePasswordRequest  true  "Password change"
// @Success      200   {object}  map[string]string
// @Failure      400   {object}  map[string]string
// @Security     BearerAuth
// @Router       /users/me/password [patch]
func (h *UserHandler) ChangePassword(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var req dto.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.ChangePassword(userID.(string), &req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "password updated successfully"})
}
