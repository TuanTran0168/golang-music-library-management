package database

import (
	"context"
	"log"
	config "music-library-api/configs"

	"github.com/redis/go-redis/v9"
)

func ConnectRedis(cfg *config.Config) *redis.Client {
	if cfg.RedisURL == "" {
		log.Println("⚠️  REDIS_URL not set — running without Redis cache")
		return nil
	}

	opts, err := redis.ParseURL(cfg.RedisURL)
	if err != nil {
		log.Printf("⚠️  Invalid REDIS_URL: %v — running without Redis cache", err)
		return nil
	}

	client := redis.NewClient(opts)

	if _, err := client.Ping(context.Background()).Result(); err != nil {
		log.Printf("⚠️  Failed to connect to Redis: %v — running without Redis cache", err)
		return nil
	}

	log.Println("✅ Connected to Redis")
	return client
}
