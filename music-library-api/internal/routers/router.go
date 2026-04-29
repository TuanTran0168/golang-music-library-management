package router

import (
	configs "music-library-api/configs"
	"music-library-api/internal/handlers"
	"music-library-api/internal/middlewares"

	"github.com/gin-gonic/gin"
)

func NewRouter(
	cfg *configs.Config,
	authHandler *handlers.AuthHandler,
	userHandler *handlers.UserHandler,
	trackHandler *handlers.TrackHandler,
	playlistHandler *handlers.PlaylistHandler,
	playEventHandler *handlers.PlayEventHandler,
) *gin.Engine {
	r := gin.Default()
	r.Use(middlewares.CORSMiddleware())

	api := r.Group("/api")

	RegisterAuthRoutes(api, authHandler, cfg)
	RegisterUserRoutes(api, userHandler, cfg)
	RegisterTrackRoutes(api, trackHandler, cfg)
	RegisterPlaylistRoutes(api, playlistHandler, cfg)
	RegisterPlayEventRoutes(api, playEventHandler, cfg)

	return r
}
