package router

import (
	configs "music-library-api/configs"
	"music-library-api/internal/handlers"
	"music-library-api/internal/middlewares"

	"github.com/gin-gonic/gin"
)

func RegisterPlayEventRoutes(rg *gin.RouterGroup, handler *handlers.PlayEventHandler, cfg *configs.Config) {
	// Public stats
	stats := rg.Group("/stats")
	{
		stats.GET("/top-tracks", handler.GetTopTracks)
		stats.GET("/summary", handler.GetSummary)
	}

	// Track-scoped (public)
	rg.GET("/tracks/:id/stats", handler.GetTrackStats)

	// Record play — OptionalAuth (guest or logged-in)
	rg.POST("/tracks/:id/play", middlewares.OptionalAuthMiddleware(cfg), handler.RecordPlay)

	// User-scoped — auth required
	me := rg.Group("/users/me")
	me.Use(middlewares.AuthMiddleware(cfg))
	{
		me.GET("/history", handler.GetMyHistory)
		me.GET("/stats", handler.GetMyStats)
	}
}
