package handlers

import (
	"mime/multipart"
	"net/http"
	"strconv"
	"strings"

	"music-library-api/internal/models"
	"music-library-api/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/hajimehoshi/go-mp3"
)

type TrackCreateRequest struct {
	Artist      string                `form:"artist" binding:"required"`
	Album       string                `form:"album"`
	Genre       string                `form:"genre"`
	ReleaseYear int                   `form:"release_year"`
	File        *multipart.FileHeader `form:"file" binding:"required"` // file mp3
}
type UpdateTrackRequest struct {
	Title       string `json:"title" binding:"required"`
	Artist      string `json:"artist" binding:"required"`
	Album       string `json:"album"`
	Genre       string `json:"genre"`
	ReleaseYear int    `json:"release_year"`
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
	var req TrackCreateRequest

	// 1. Bind multipart/form-data
	if err := c.ShouldBind(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 2. check file type
	if !strings.HasSuffix(strings.ToLower(req.File.Filename), ".mp3") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "only mp3 files are allowed"})
		return
	}

	// 3. Open file
	file, err := req.File.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot open file"})
		return
	}
	defer file.Close()

	// 4. Upload file to GridFS
	gridFSID, err := h.service.UploadMP3ToGridFS(req.File.Filename, file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to upload to GridFS"})
		return
	}

	// 5. Reset file reader and decode mp3 to get duration
	file.Seek(0, 0)
	decoder, err := mp3.NewDecoder(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot decode mp3"})
		return
	}

	const bytesPerSample = 2
	const channels = 2
	totalSamples := float64(decoder.Length()) / (bytesPerSample * channels)
	durationSeconds := totalSamples / float64(decoder.SampleRate())
	duration := int(durationSeconds)

	// 6. Create track object
	track := &models.Track{
		Title:       req.File.Filename,
		Artist:      req.Artist,
		Album:       req.Album,
		Genre:       req.Genre,
		ReleaseYear: req.ReleaseYear,
		Duration:    duration,
		FileID:      gridFSID,
	}

	// 7. Save track
	if err := h.service.CreateTrack(track); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save track"})
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
