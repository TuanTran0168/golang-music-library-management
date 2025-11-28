package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	MongoURI string
	DBName   string
	HTTPPort string
	Env      string
}

func LoadConfig() *Config {
	env := os.Getenv("ENV")
	envFile := ".env.local"
	if env == "prod" {
		envFile = ".env.prod"
	}

	if err := godotenv.Load(envFile); err != nil {
		log.Printf("[WARN] Environment file %s not found, fallback to system environment", envFile)
	}

	log.Println("========================== ENVIRONMENT ==========================")
	log.Printf("Running with environment: %s", envFile)
	log.Printf("MONGO_URI: %s", os.Getenv("MONGO_URI"))
	log.Printf("DB_NAME: %s", os.Getenv("DB_NAME"))
	log.Println("=================================================================")

	return &Config{
		MongoURI: os.Getenv("MONGO_URI"),
		DBName:   os.Getenv("DB_NAME"),
		HTTPPort: os.Getenv("HTTP_PORT"),
		Env:      env,
	}
}
