package handlers

import (
	"log"
	"net/http"
	"strconv"

	"music-library-api/internal/services"
	"music-library-api/pkg/constants"
	"music-library-api/pkg/kafka"

	"github.com/gin-gonic/gin"
)

type PlayEventHandler struct {
	service      services.IPlayEventService
	trackService services.ITrackService
	producer     *kafka.Producer
}

func NewPlayEventHandler(
	service services.IPlayEventService,
	trackService services.ITrackService,
	producer *kafka.Producer,
) *PlayEventHandler {
	return &PlayEventHandler{
		service:      service,
		trackService: trackService,
		producer:     producer,
	}
}

// RecordPlay godoc
// @Summary      Record a play event
// @Description  Record that a track was played. Auth optional — guest plays are tracked anonymously.
// @Tags         stats
// @Param        id   path  string  true  "Track ID"
// @Success      202
// @Failure      404  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /tracks/{id}/play [post]
func (h *PlayEventHandler) RecordPlay(c *gin.Context) {
	trackID := c.Param("id")

	if _, err := h.trackService.GetTrackByID(trackID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "track not found"})
		return
	}

	userID := ""
	if uid, exists := c.Get("user_id"); exists {
		userID = uid.(string)
	}

	if h.producer != nil {
		// Kafka path: publish to topic, consumer handles MongoDB write
		if err := h.producer.PublishPlayEvent(c.Request.Context(), userID, trackID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to record play"})
			return
		}
	} else {
		// Goroutine path (no Kafka): write directly to MongoDB async
		go func() {
			if err := h.service.RecordPlay(userID, trackID); err != nil {
				log.Printf("⚠️  direct play record failed: %v", err)
			}
		}()
	}

	c.Status(http.StatusAccepted)
}

// GetMyHistory godoc
// @Summary      Get play history
// @Description  Get the current user's play history, sorted newest first
// @Tags         stats
// @Produce      json
// @Param        page   query  int  false  "Page number"
// @Param        limit  query  int  false  "Page size"
// @Success      200  {object}  dto.PlayHistoryResponse
// @Failure      500  {object}  map[string]string
// @Security     BearerAuth
// @Router       /users/me/history [get]
func (h *PlayEventHandler) GetMyHistory(c *gin.Context) {
	userID, _ := c.Get("user_id")
	page, limit := constants.ParsePagination(c.Query("page"), c.Query("limit"))

	resp, err := h.service.GetHistory(userID.(string), page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

// GetTopTracks godoc
// @Summary      Get top tracks
// @Description  Get globally most-played tracks
// @Tags         stats
// @Produce      json
// @Param        limit  query  int  false  "Number of tracks (max 50, default 10)"
// @Success      200  {object}  dto.TopTracksResponse
// @Failure      500  {object}  map[string]string
// @Router       /stats/top-tracks [get]
func (h *PlayEventHandler) GetTopTracks(c *gin.Context) {
	limit := 10
	if l := c.Query("limit"); l != "" {
		if v, err := strconv.Atoi(l); err == nil && v > 0 && v <= 50 {
			limit = v
		}
	}

	resp, err := h.service.GetTopTracks(limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

// GetSummary godoc
// @Summary      Get system summary
// @Description  Get total plays, total tracks, and top genres
// @Tags         stats
// @Produce      json
// @Success      200  {object}  dto.SummaryResponse
// @Failure      500  {object}  map[string]string
// @Router       /stats/summary [get]
func (h *PlayEventHandler) GetSummary(c *gin.Context) {
	resp, err := h.service.GetSummary()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

// GetTrackStats godoc
// @Summary      Get track play count
// @Description  Get total play count for a specific track
// @Tags         stats
// @Produce      json
// @Param        id  path  string  true  "Track ID"
// @Success      200  {object}  dto.TrackStatsResponse
// @Failure      500  {object}  map[string]string
// @Router       /tracks/{id}/stats [get]
func (h *PlayEventHandler) GetTrackStats(c *gin.Context) {
	trackID := c.Param("id")

	resp, err := h.service.GetTrackStats(trackID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

// GetMyStats godoc
// @Summary      Get personal stats
// @Description  Get total plays and top tracks for the current user
// @Tags         stats
// @Produce      json
// @Success      200  {object}  dto.UserStatsResponse
// @Failure      500  {object}  map[string]string
// @Security     BearerAuth
// @Router       /users/me/stats [get]
func (h *PlayEventHandler) GetMyStats(c *gin.Context) {
	userID, _ := c.Get("user_id")

	resp, err := h.service.GetUserStats(userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}
