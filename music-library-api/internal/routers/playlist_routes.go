package router

import (
	configs "music-library-api/configs"
	"music-library-api/internal/handlers"
	"music-library-api/internal/middlewares"

	"github.com/gin-gonic/gin"
)

func RegisterPlaylistRoutes(rg *gin.RouterGroup, handler *handlers.PlaylistHandler, cfg *configs.Config) {
	playlists := rg.Group("/playlists")
	{
		// Public routes
		playlists.GET("", handler.GetPlaylists)
		playlists.GET("/:id", handler.GetPlaylistByID)
		playlists.GET("/:id/stream", handler.StreamPlaylistM3U)

		// Protected routes (require auth)
		protected := playlists.Group("")
		protected.Use(middlewares.AuthMiddleware(cfg))
		{
			protected.POST("", handler.CreatePlaylist)
			protected.PATCH("/:id", handler.UpdatePlaylist)
			protected.DELETE("/:id", handler.DeletePlaylist)
		}
	}
}
