package database

import (
	"context"
	"log"
	config "music-library-api/configs"

	"github.com/redis/go-redis/v9"
)

func ConnectRedis(cfg *config.Config) *redis.Client {
	opts, err := redis.ParseURL(cfg.RedisURL)
	if err != nil {
		log.Fatalf("❌ Invalid REDIS_URL: %v", err)
	}

	client := redis.NewClient(opts)

	if _, err := client.Ping(context.Background()).Result(); err != nil {
		log.Fatalf("❌ Failed to connect to Redis: %v", err)
	}

	log.Println("✅ Connected to Redis")
	return client
}
