package main

import (
	"log"

	configs "music-library-api/configs"
	"music-library-api/internal/handlers"
	"music-library-api/internal/repositories"
	router "music-library-api/internal/routers"
	"music-library-api/internal/services"
	database "music-library-api/pkg/databases"
	"music-library-api/pkg/utils"

	_ "music-library-api/docs"

	"github.com/gin-gonic/gin"
	"github.com/kamva/mgm/v3"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// @title Music Library API
// @version 1.0
// @description Clean architecture Music Library API with Golang (Gin) + MongoDB, featuring CRUD, MP3 uploads, search, and basic MP3 streaming.
// @host localhost:8080
// @BasePath /api
// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Type "Bearer {your token}" to authenticate.
func main() {
	// 1. Load config
	cfg := configs.LoadConfig()

	// 2. Connect MongoDB
	database.ConnectMongo(cfg)
	_, _, mongodb, _ := mgm.DefaultConfigs()

	cloudUtil, err := utils.NewCloudinaryUtil(cfg)
	if err != nil {
		log.Fatal("❌ Failed to init Cloudinary: ", err)
	}

	// 3. Initialize repositories
	trackRepo := repositories.NewTrackRepository(mongodb)
	playlistRepo := repositories.NewPlaylistRepository()

	// 4. Initialize services
	trackService := services.NewTrackService(trackRepo, mongodb)
	playlistService := services.NewPlaylistService(playlistRepo, trackService, cloudUtil)

	// 5. Initialize handlers
	trackHandler := handlers.NewTrackHandler(trackService, mongodb)
	playlistHandler := handlers.NewPlaylistHandler(playlistService)

	// 6. Initialize router
	server := router.NewRouter(trackHandler, playlistHandler)

	// 7. Swagger
	server.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// 8. Health check
	server.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "Hello Music Library API!"})
	})

	// 9. Start server
	port := cfg.HTTPPort
	log.Printf("Server running at :%s", port)
	if err := server.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
