package router

import (
	configs "music-library-api/configs"
	"music-library-api/internal/handlers"
	"music-library-api/internal/middlewares"
	"music-library-api/internal/models"

	"github.com/gin-gonic/gin"
)

func RegisterTrackRoutes(rg *gin.RouterGroup, handler *handlers.TrackHandler, cfg *configs.Config) {
	tracks := rg.Group("/tracks")
	{
		tracks.GET("/:id", handler.GetTrackByID)
		tracks.GET("/search", middlewares.OptionalAuthMiddleware(cfg), handler.SearchTracks)
		tracks.GET("/:id/stream", handler.StreamTrack)
		tracks.GET("", middlewares.OptionalAuthMiddleware(cfg), handler.GetTracks)

		protected := tracks.Group("")
		protected.Use(middlewares.AuthMiddleware(cfg))
		protected.Use(middlewares.RequireRoles(models.RoleAdmin, models.RoleArtist))
		{
			protected.POST("", handler.CreateTrack)
			protected.PATCH("/:id", handler.UpdateTrack)
			protected.DELETE("/:id", handler.DeleteTrack)
		}
	}
}
