package repositories

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

const cacheTTL = 5 * time.Minute

const (
	keyTopTracks       = "stats:top-tracks"
	keySummary         = "stats:summary"
	keyTrackStats      = "stats:track:%s:play_count"
	keyUserStats       = "stats:user:%s"
)

type IStatsCacheRepository interface {
	GetTopTracks() (string, error)
	SetTopTracks(data string) error
	GetSummary() (string, error)
	SetSummary(data string) error
	GetTrackStats(trackID string) (string, error)
	SetTrackStats(trackID string, data string) error
	GetUserStats(userID string) (string, error)
	SetUserStats(userID string, data string) error
	InvalidateOnPlay(trackID string, userID string) error
}

type statsCacheRepository struct {
	client *redis.Client
}

func NewStatsCacheRepository(client *redis.Client) IStatsCacheRepository {
	return &statsCacheRepository{client: client}
}

func (r *statsCacheRepository) get(key string) (string, error) {
	val, err := r.client.Get(context.Background(), key).Result()
	if err == redis.Nil {
		return "", nil
	}
	return val, err
}

func (r *statsCacheRepository) set(key, value string) error {
	return r.client.Set(context.Background(), key, value, cacheTTL).Err()
}

func (r *statsCacheRepository) GetTopTracks() (string, error) {
	return r.get(keyTopTracks)
}

func (r *statsCacheRepository) SetTopTracks(data string) error {
	return r.set(keyTopTracks, data)
}

func (r *statsCacheRepository) GetSummary() (string, error) {
	return r.get(keySummary)
}

func (r *statsCacheRepository) SetSummary(data string) error {
	return r.set(keySummary, data)
}

func (r *statsCacheRepository) GetTrackStats(trackID string) (string, error) {
	return r.get(fmt.Sprintf(keyTrackStats, trackID))
}

func (r *statsCacheRepository) SetTrackStats(trackID string, data string) error {
	return r.set(fmt.Sprintf(keyTrackStats, trackID), data)
}

func (r *statsCacheRepository) GetUserStats(userID string) (string, error) {
	return r.get(fmt.Sprintf(keyUserStats, userID))
}

func (r *statsCacheRepository) SetUserStats(userID string, data string) error {
	return r.set(fmt.Sprintf(keyUserStats, userID), data)
}

func (r *statsCacheRepository) InvalidateOnPlay(trackID string, userID string) error {
	keys := []string{
		keyTopTracks,
		keySummary,
		fmt.Sprintf(keyTrackStats, trackID),
	}
	if userID != "" {
		keys = append(keys, fmt.Sprintf(keyUserStats, userID))
	}
	return r.client.Del(context.Background(), keys...).Err()
}
