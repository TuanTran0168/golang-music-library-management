package router

import (
	"music-library-api/internal/handlers"

	"github.com/gin-gonic/gin"
)

func NewRouter(
	trackHandler *handlers.TrackHandler,
	playlistHandler *handlers.PlaylistHandler,
) *gin.Engine {
	r := gin.Default()

	api := r.Group("/api")

	RegisterTrackRoutes(api, trackHandler)
	RegisterPlaylistRoutes(api, playlistHandler)

	return r
}
