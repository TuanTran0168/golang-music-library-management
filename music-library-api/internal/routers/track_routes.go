package router

import (
	"music-library-api/internal/handlers"

	"github.com/gin-gonic/gin"
)

func RegisterTrackRoutes(rg *gin.RouterGroup, handler *handlers.TrackHandler) {
	tracks := rg.Group("/tracks")
	{
		tracks.GET("/:id", handler.GetTrackByID)
		tracks.GET("/search", handler.SearchTracks)
		tracks.GET("/stream/:id", handler.StreamTrack)
		tracks.GET("", handler.GetTracks)
		tracks.POST("", handler.CreateTrack)
		tracks.PATCH("/:id", handler.UpdateTrack)
		tracks.DELETE("/:id", handler.DeleteTrack)
	}
}
