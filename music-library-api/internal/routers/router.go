package router

import (
	"music-library-api/internal/handlers"
	"music-library-api/internal/middlewares"

	"github.com/gin-gonic/gin"
)

func NewRouter(
	trackHandler *handlers.TrackHandler,
	playlistHandler *handlers.PlaylistHandler,
) *gin.Engine {
	r := gin.Default()
	r.Use(middlewares.CORSMiddleware())

	api := r.Group("/api")

	RegisterTrackRoutes(api, trackHandler)
	RegisterPlaylistRoutes(api, playlistHandler)

	return r
}
