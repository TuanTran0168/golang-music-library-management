package main

import (
	"log"

	configs "music-library-api/configs"
	"music-library-api/internal/handlers"
	"music-library-api/internal/repositories"
	router "music-library-api/internal/routers"
	"music-library-api/internal/services"
	database "music-library-api/pkg/databases"

	"github.com/gin-gonic/gin"
	"github.com/kamva/mgm/v3"
)

func main() {
	// 1. Load config
	cfg := configs.LoadConfig()

	// 2. Connect MongoDB
	database.ConnectMongo(cfg)
	_, _, mongodb, _ := mgm.DefaultConfigs()

	// 3. Initialize repositories
	trackRepo := repositories.NewTrackRepository()
	playlistRepo := repositories.NewPlaylistRepository()

	// 4. Initialize services
	trackService := services.NewTrackService(trackRepo, mongodb)
	playlistService := services.NewPlaylistService(playlistRepo)

	// 5. Initialize handlers
	trackHandler := handlers.NewTrackHandler(trackService, mongodb)
	playlistHandler := handlers.NewPlaylistHandler(playlistService)

	// 6. Initialize router
	server := router.NewRouter(trackHandler, playlistHandler)

	// 7. Health check
	server.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "Hello Music Library API!"})
	})

	// 8. Start server
	port := cfg.HTTPPort
	log.Printf("Server running at :%s", port)
	if err := server.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
