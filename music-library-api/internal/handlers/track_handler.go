package handlers

import (
	"net/http"
	"strconv"

	"music-library-api/internal/models"
	"music-library-api/internal/services"

	"github.com/gin-gonic/gin"
)

type CreateTrackRequest struct {
	Title       string `json:"title" binding:"required"`
	Artist      string `json:"artist" binding:"required"`
	Album       string `json:"album"`
	Genre       string `json:"genre"`
	ReleaseYear int    `json:"release_year"`
	Duration    int    `json:"duration"` // seconds
	MP3URL      string `json:"mp3_url"`  // Cloud URL
}

type UpdateTrackRequest struct {
	Title       string `json:"title" binding:"required"`
	Artist      string `json:"artist" binding:"required"`
	Album       string `json:"album"`
	Genre       string `json:"genre"`
	ReleaseYear int    `json:"release_year"`
	Duration    int    `json:"duration"`
	MP3URL      string `json:"mp3_url"`
}

type TrackHandler struct {
	service services.ITrackService
}

func NewTrackHandler(service services.ITrackService) *TrackHandler {
	return &TrackHandler{service: service}
}

// GET /tracks
func (h *TrackHandler) GetTracks(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	tracks, err := h.service.GetTracks(page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"page": page, "limit": limit, "data": tracks})
}

// GET /tracks/:id
func (h *TrackHandler) GetTrackByID(c *gin.Context) {
	id := c.Param("id")
	track, err := h.service.GetTrackByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "track not found"})
		return
	}
	c.JSON(http.StatusOK, track)
}

// POST /tracks
func (h *TrackHandler) CreateTrack(c *gin.Context) {
	var req CreateTrackRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	track := &models.Track{
		Title:       req.Title,
		Artist:      req.Artist,
		Album:       req.Album,
		Genre:       req.Genre,
		ReleaseYear: req.ReleaseYear,
		Duration:    req.Duration,
		URL:         req.MP3URL,
	}

	if err := h.service.CreateTrack(track); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, track)
}

// PATCH /tracks/:id
func (h *TrackHandler) UpdateTrack(c *gin.Context) {
	id := c.Param("id")

	track, err := h.service.GetTrackByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "track not found"})
		return
	}

	var req UpdateTrackRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Title != "" {
		track.Title = req.Title
	}
	if req.Artist != "" {
		track.Artist = req.Artist
	}
	if req.Album != "" {
		track.Album = req.Album
	}
	if req.Genre != "" {
		track.Genre = req.Genre
	}
	if req.ReleaseYear != 0 {
		track.ReleaseYear = req.ReleaseYear
	}
	if req.Duration != 0 {
		track.Duration = req.Duration
	}
	if req.MP3URL != "" {
		track.URL = req.MP3URL
	}

	if err := h.service.UpdateTrack(track); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, track)
}

// DELETE /tracks/:id
func (h *TrackHandler) DeleteTrack(c *gin.Context) {
	id := c.Param("id")
	track, err := h.service.GetTrackByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "track not found"})
		return
	}

	if err := h.service.DeleteTrack(track.ID.Hex()); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

// GET /tracks/search
func (h *TrackHandler) SearchTracks(c *gin.Context) {
	query := c.Query("q")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	tracks, err := h.service.SearchTracks(query, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"page": page, "limit": limit, "data": tracks})
}
