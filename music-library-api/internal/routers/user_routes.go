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
	users.Use(middlewares.RequireRoles(models.RoleAdmin))
	{
		users.GET("", handler.GetAllUsers)
		users.PATCH("/:id/role", handler.UpdateUserRole)
	}
}
