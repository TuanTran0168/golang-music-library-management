package router

import (
	"music-library-api/internal/handlers"

	"github.com/gin-gonic/gin"
)

func RegisterUserRoutes(rg *gin.RouterGroup, handler *handlers.UserHandler) {
	users := rg.Group("/users")
	{
		users.GET("", handler.GetUsers)
		users.POST("", handler.CreateUser)
		users.GET(":id", handler.GetUserByID)
		users.PATCH(":id", handler.UpdateUser)
		users.DELETE(":id", handler.DeleteUser)

		users.POST(":id/favorites/:trackId", handler.AddFavoriteTrack)
		users.DELETE(":id/favorites/:trackId", handler.RemoveFavoriteTrack)
	}
}
