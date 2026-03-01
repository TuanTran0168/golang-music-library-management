package router

import (
	configs "music-library-api/configs"
	"music-library-api/internal/handlers"
	"music-library-api/internal/middlewares"
	"music-library-api/internal/models"

	"github.com/gin-gonic/gin"
)

func RegisterUserRoutes(rg *gin.RouterGroup, handler *handlers.UserHandler, cfg *configs.Config) {
	users := rg.Group("/users")
	users.Use(middlewares.AuthMiddleware(cfg))
	{
		// Self (any authenticated user)
		users.GET("/me", handler.GetMe)
		users.PATCH("/me", handler.UpdateMe)
		users.PATCH("/me/password", handler.ChangePassword)

		// Admin only
		adminOnly := users.Group("")
		adminOnly.Use(middlewares.RequireRoles(models.RoleAdmin))
		{
			adminOnly.GET("", handler.GetAllUsers)
			adminOnly.GET("/:id", handler.GetUserByID)
			adminOnly.PATCH("/:id/role", handler.UpdateUserRole)
			adminOnly.PATCH("/:id/info", handler.UpdateUserInfo)
		}
	}
}
