package config

import (
	"log"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	MongoURI string
	DBName   string
	HTTPPort string
	Env      string

	// Cloudinary
	CloudName string
	APIKey    string
	APISecret string

	// JWT
	JWTSecret     string
	JWTExpiration string // e.g., "72h"

	// Admin
	AdminRoleKey string

	// Redis
	RedisURL string

	// Kafka
	KafkaBrokers  string // comma-separated, e.g. "kafka:9092"
	KafkaTopic    string // e.g. "play-events"
	KafkaUsername string
	KafkaPassword string
	KafkaTLS      bool
}

func LoadConfig() *Config {
	env := os.Getenv("ENV")
	envFile := ".env.local"
	if env == "prod" {
		envFile = ".env.prod"
	}

	if err := godotenv.Load(envFile); err != nil {
		log.Printf("⚠️  %s not found — falling back to system environment", envFile)
	}

	log.Println("📋 ───────────────── CONFIG ─────────────────")
	log.Printf("   ENV      : %s", envFile)
	log.Printf("   MONGO_URI: %s", os.Getenv("MONGO_URI"))
	log.Printf("   DB_NAME  : %s", os.Getenv("DB_NAME"))
	log.Printf("   CLOUD    : %s", os.Getenv("CLOUDINARY_CLOUD_NAME"))
	log.Println("   ─────────────────────────────────────────")

	return &Config{
		MongoURI:      os.Getenv("MONGO_URI"),
		DBName:        os.Getenv("DB_NAME"),
		HTTPPort:      os.Getenv("HTTP_PORT"),
		CloudName:     os.Getenv("CLOUDINARY_CLOUD_NAME"),
		APIKey:        os.Getenv("CLOUDINARY_API_KEY"),
		APISecret:     os.Getenv("CLOUDINARY_API_SECRET"),
		Env:           env,
		JWTSecret:     os.Getenv("JWT_SECRET"),
		JWTExpiration: os.Getenv("JWT_EXPIRATION"),
		AdminRoleKey:  os.Getenv("ADMIN_ROLE_KEY"),
		RedisURL:      os.Getenv("REDIS_URL"),
		KafkaBrokers:  os.Getenv("KAFKA_BROKERS"),
		KafkaTopic:    os.Getenv("KAFKA_TOPIC"),
		KafkaUsername: os.Getenv("KAFKA_USERNAME"),
		KafkaPassword: os.Getenv("KAFKA_PASSWORD"),
		KafkaTLS:      strings.EqualFold(os.Getenv("KAFKA_TLS"), "true"),
	}
}
