package handlers

import (
	"net/http"
	"time"

	"music-library-api/internal/dto"
	"music-library-api/internal/services"

	"github.com/gin-gonic/gin"
)

const refreshCookieName = "refresh_token"

type AuthHandler struct {
	service services.IAuthService
}

func NewAuthHandler(service services.IAuthService) *AuthHandler {
	return &AuthHandler{
		service: service,
	}
}

func setRefreshCookie(c *gin.Context, token string) {
	c.SetCookie(
		refreshCookieName,
		token,
		int((7 * 24 * time.Hour).Seconds()),
		"/",
		"",    // domain: empty = same domain
		false, // Secure: set to true in production with HTTPS
		true,  // HttpOnly: JS cannot read this
	)
}

func clearRefreshCookie(c *gin.Context) {
	c.SetCookie(refreshCookieName, "", -1, "/", "", false, true)
}

// Register godoc
// @Summary      Register a new user
// @Description  Create a new user account. Provide role_key only when registering as admin.
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        body  body      dto.RegisterRequest  true  "User registration info"
// @Success      201   {object}  dto.AuthResponse
// @Failure      400   {object}  map[string]string
// @Router       /auth/register [post]
func (h *AuthHandler) Register(c *gin.Context) {
	var req dto.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	res, err := h.service.Register(&req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, res)
}

// @Summary Login user — returns access_token in body, refresh_token as HttpOnly cookie
// @Description  Authenticate user. Returns access_token in body and refresh_token as HttpOnly cookie.
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        body  body      dto.LoginRequest  true  "User login credentials"
// @Success      200   {object}  dto.AuthResponse
// @Failure      400   {object}  map[string]string
// @Failure      401   {object}  map[string]string
// @Router       /auth/login [post]
func (h *AuthHandler) Login(c *gin.Context) {
	var req dto.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	res, refreshToken, err := h.service.Login(&req)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	setRefreshCookie(c, refreshToken)
	c.JSON(http.StatusOK, res)
}

// @Summary Refresh access token using the HttpOnly refresh_token cookie
// @Description  Refresh access token using the HttpOnly refresh_token cookie.
// @Tags         auth
// @Produce      json
// @Param        Cookie  header    string  true  "refresh_token cookie"
// @Success      200            {object}  dto.AuthResponse
// @Failure      401            {object}  map[string]string
// @Router       /auth/refresh [post]
func (h *AuthHandler) Refresh(c *gin.Context) {
	refreshToken, err := c.Cookie(refreshCookieName)
	if err != nil || refreshToken == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "refresh token missing"})
		return
	}

	res, newRefreshToken, err := h.service.Refresh(refreshToken)
	if err != nil {
		clearRefreshCookie(c)
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	// Token rotation: issue a fresh refresh token
	setRefreshCookie(c, newRefreshToken)
	c.JSON(http.StatusOK, res)
}

// @Summary Logout — revokes session and clears cookie
// @Description  Revoke the current user's session and clear the refresh_token cookie.
// @Tags         auth
// @Produce      json
// @Success      200  {object}  map[string]string
// @Failure      401  {object}  map[string]string
// @Security     BearerAuth
// @Router       /auth/logout [post]
func (h *AuthHandler) Logout(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	_ = h.service.Logout(userID.(string))
	clearRefreshCookie(c)
	c.JSON(http.StatusOK, gin.H{"message": "logged out successfully"})
}
