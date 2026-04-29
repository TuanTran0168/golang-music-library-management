package kafka

import (
	"context"
	"encoding/json"
	"log"
	"strings"

	"music-library-api/internal/models"
	"music-library-api/internal/repositories"

	"github.com/kamva/mgm/v3"
	kafkago "github.com/segmentio/kafka-go"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Consumer struct {
	reader    *kafkago.Reader
	playRepo  repositories.IPlayEventRepository
	cacheRepo repositories.IStatsCacheRepository
}

func NewConsumer(
	brokers string,
	topic string,
	playRepo repositories.IPlayEventRepository,
	cacheRepo repositories.IStatsCacheRepository,
) *Consumer {
	brokerList := strings.Split(brokers, ",")
	reader := kafkago.NewReader(kafkago.ReaderConfig{
		Brokers:  brokerList,
		Topic:    topic,
		GroupID:  "play-events-consumer",
		MinBytes: 1,
		MaxBytes: 10e6,
	})
	return &Consumer{
		reader:    reader,
		playRepo:  playRepo,
		cacheRepo: cacheRepo,
	}
}

func (c *Consumer) Start(ctx context.Context) {
	log.Println("🎯 Kafka consumer started")
	for {
		msg, err := c.reader.ReadMessage(ctx)
		if err != nil {
			if ctx.Err() != nil {
				log.Println("🛑 Kafka consumer stopped")
				return
			}
			log.Printf("[WARN] kafka read error: %v", err)
			continue
		}

		var event PlayEventMessage
		if err := json.Unmarshal(msg.Value, &event); err != nil {
			log.Printf("[WARN] failed to unmarshal play event: %v", err)
			continue
		}

		if err := c.processEvent(ctx, event); err != nil {
			log.Printf("[WARN] failed to process play event: %v", err)
		}
	}
}

func (c *Consumer) processEvent(ctx context.Context, event PlayEventMessage) error {
	trackID, err := primitive.ObjectIDFromHex(event.TrackID)
	if err != nil {
		return err
	}

	var userID *primitive.ObjectID
	if event.UserID != "" {
		id, err := primitive.ObjectIDFromHex(event.UserID)
		if err == nil {
			userID = &id
		}
	}

	playEvent := &models.PlayEvent{
		UserID:  userID,
		TrackID: trackID,
	}
	// mgm.Coll uses PlayEvent.CollectionName() = "play_events"
	if err := mgm.Coll(playEvent).Create(playEvent); err != nil {
		return err
	}

	return c.cacheRepo.InvalidateOnPlay(event.TrackID, event.UserID)
}

func (c *Consumer) Close() error {
	return c.reader.Close()
}
