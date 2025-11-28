package database

import (
	"log"
	config "music-library-api/configs"

	"github.com/kamva/mgm/v3"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func ConnectMongo(cfg *config.Config) {
	err := mgm.SetDefaultConfig(nil, cfg.DBName, options.Client().ApplyURI(cfg.MongoURI))
	if err != nil {
		log.Fatalf("❌ Failed to connect to MongoDB: %v", err)
	}
	log.Println("✅ Connected to MongoDB successfully")
}
