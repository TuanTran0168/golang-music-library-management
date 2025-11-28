package main

import (
	"log"

	configs "music-library-api/configs"
	database "music-library-api/pkg/databases"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg := configs.LoadConfig()

	database.ConnectMongo(cfg)

	r := gin.Default()

	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "Hello World"})
	})

	port := cfg.HTTPPort
	log.Println("Server running at :" + port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
