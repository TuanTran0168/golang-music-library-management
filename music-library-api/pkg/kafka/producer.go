package kafka

import (
	"context"
	"encoding/json"
	"strings"
	"time"

	kafkago "github.com/segmentio/kafka-go"
)

type PlayEventMessage struct {
	UserID   string `json:"user_id"`  // empty string if guest
	TrackID  string `json:"track_id"`
	PlayedAt string `json:"played_at"` // RFC3339
}

type Producer struct {
	writer *kafkago.Writer
}

func NewProducer(brokers string, topic string) *Producer {
	brokerList := strings.Split(brokers, ",")
	writer := &kafkago.Writer{
		Addr:                   kafkago.TCP(brokerList...),
		Topic:                  topic,
		AllowAutoTopicCreation: true,
		Balancer:               &kafkago.LeastBytes{},
	}
	return &Producer{writer: writer}
}

func (p *Producer) PublishPlayEvent(ctx context.Context, userID, trackID string) error {
	msg := PlayEventMessage{
		UserID:   userID,
		TrackID:  trackID,
		PlayedAt: time.Now().UTC().Format(time.RFC3339),
	}

	value, err := json.Marshal(msg)
	if err != nil {
		return err
	}

	return p.writer.WriteMessages(ctx, kafkago.Message{Value: value})
}

func (p *Producer) Close() error {
	return p.writer.Close()
}
