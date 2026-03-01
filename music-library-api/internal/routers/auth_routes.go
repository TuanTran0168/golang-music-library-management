package router

import (
	"music-library-api/internal/handlers"
	"music-library-api/internal/middlewares"

	configs "music-library-api/configs"

	"github.com/gin-gonic/gin"
)

func RegisterAuthRoutes(router *gin.RouterGroup, handler *handlers.AuthHandler, cfg *configs.Config) {
	authGroup := router.Group("/auth")
	{
		authGroup.POST("/register", handler.Register)
		authGroup.POST("/login", handler.Login)
		authGroup.POST("/refresh", handler.Refresh)                                // Cookie-based, no auth middleware
		authGroup.POST("/logout", middlewares.AuthMiddleware(cfg), handler.Logout) // Requires valid access token
	}
}
