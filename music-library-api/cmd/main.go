package main

import (
	"context"
	"log"

	configs "music-library-api/configs"
	"music-library-api/internal/handlers"
	"music-library-api/internal/repositories"
	router "music-library-api/internal/routers"
	"music-library-api/internal/services"
	database "music-library-api/pkg/databases"
	"music-library-api/pkg/kafka"
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
// @host
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

	// 3. Connect Redis
	redisClient := database.ConnectRedis(cfg)

	// 4. Init Cloudinary
	cloudUtil, err := utils.NewCloudinaryUtil(cfg)
	if err != nil {
		log.Fatal("❌ Failed to init Cloudinary: ", err)
	}

	// 5. Initialize repositories
	userRepo := repositories.NewUserRepository(mongodb)
	trackRepo := repositories.NewTrackRepository(mongodb)
	playlistRepo := repositories.NewPlaylistRepository()
	playEventRepo := repositories.NewPlayEventRepository(mongodb)
	statsCacheRepo := repositories.NewStatsCacheRepository(redisClient)

	// 6. Initialize services
	authService := services.NewAuthService(userRepo, cfg)
	userService := services.NewUserService(userRepo)
	trackService := services.NewTrackService(trackRepo, mongodb)
	playlistService := services.NewPlaylistService(playlistRepo, trackService, cloudUtil)
	playEventService := services.NewPlayEventService(playEventRepo, statsCacheRepo, trackService)

	// 7. Initialize Kafka producer (optional — skipped if KAFKA_BROKERS is unset)
	var producer *kafka.Producer
	if cfg.KafkaBrokers != "" {
		kafkaConfig := kafka.ClientConfig{
			Brokers:  cfg.KafkaBrokers,
			Topic:    cfg.KafkaTopic,
			Username: cfg.KafkaUsername,
			Password: cfg.KafkaPassword,
			TLS:      cfg.KafkaTLS,
		}
		producer = kafka.NewProducer(kafkaConfig)
		defer producer.Close()

		// 8. Start Kafka consumer in background
		consumer := kafka.NewConsumer(kafkaConfig, playEventRepo, statsCacheRepo)
		defer consumer.Close()
		go consumer.Start(context.Background())
	} else {
		log.Println("⚠️  KAFKA_BROKERS not set — play events will be written directly to MongoDB")
	}

	// 9. Initialize handlers
	authHandler := handlers.NewAuthHandler(authService)
	userHandler := handlers.NewUserHandler(userService)
	trackHandler := handlers.NewTrackHandler(trackService, mongodb)
	playlistHandler := handlers.NewPlaylistHandler(playlistService)
	playEventHandler := handlers.NewPlayEventHandler(playEventService, trackService, producer)

	// 10. Initialize router
	server := router.NewRouter(cfg, authHandler, userHandler, trackHandler, playlistHandler, playEventHandler)

	// 11. Swagger
	server.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// 12. Health check
	server.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "Hello Music Library API!"})
	})

	// 13. Start server
	port := cfg.HTTPPort
	log.Printf("🚀 Server running at :%s", port)
	if err := server.Run(":" + port); err != nil {
		log.Fatalf("❌ Failed to start server: %v", err)
	}
}
