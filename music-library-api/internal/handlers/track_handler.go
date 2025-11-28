package handlers

import (
	"io"
	"mime/multipart"
	"net/http"
	"strconv"
	"strings"

	"music-library-api/internal/models"
	"music-library-api/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/hajimehoshi/go-mp3"
	"go.mongodb.org/mongo-driver/mongo"
)

type TrackCreateRequest struct {
	Artist      string                `form:"artist" binding:"required"`
	Album       string                `form:"album"`
	Genre       string                `form:"genre"`
	ReleaseYear int                   `form:"release_year"`
	File        *multipart.FileHeader `form:"file" binding:"required"`
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
	mongodb *mongo.Database
}

func NewTrackHandler(service services.ITrackService, mongodb *mongo.Database) *TrackHandler {
	return &TrackHandler{
		service: service,
		mongodb: mongodb,
	}
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

	c.JSON(http.StatusOK, gin.H{
		"page":  page,
		"limit": limit,
		"data":  tracks,
	})
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
		c.JSON(http.StatusBadRequest, gin.H{"error": "only mp3 files allowed"})
		return
	}

	// 3. Open file
	file, err := req.File.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to open file"})
		return
	}
	defer file.Close()

	// 4. Upload file to GridFS
	gridFSID, err := h.service.UploadMP3ToGridFS(req.File.Filename, file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "upload to GridFS failed"})
		return
	}

	// 5. Reset file reader and decode mp3 to get duration
	file.Seek(0, 0)
	decoder, err := mp3.NewDecoder(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to decode mp3"})
		return
	}

	durationSeconds := (float64(decoder.Length()) / 4) / float64(decoder.SampleRate())
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

	c.Status(http.StatusNoContent)
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

// GET /tracks/stream/:id
func (h *TrackHandler) StreamTrack(c *gin.Context) {
	id := c.Param("id")

	track, err := h.service.GetTrackByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "track not found"})
		return
	}

	rangeHeader := c.GetHeader("Range")

	stream, err := h.service.OpenTrackStream(track.FileID, rangeHeader)
	if err != nil {
		c.JSON(http.StatusRequestedRangeNotSatisfiable, gin.H{"error": err.Error()})
		return
	}
	defer stream.Reader.Close()

	// --- RESPONSE HEADERS ---
	c.Header("Content-Type", "audio/mpeg")
	c.Header("Accept-Ranges", "bytes")
	c.Header("Content-Disposition", "inline; filename=\""+track.Title+"\"")
	c.Header("Content-Range", stream.ContentRange)
	c.Status(http.StatusPartialContent)

	// Compute the number of bytes to copy
	toCopy := (stream.End - stream.Start) + 1

	buf := make([]byte, 32*1024)
	var copied int64 = 0

	for copied < toCopy {
		n, err := stream.Reader.Read(buf)
		if n > 0 {
			remain := toCopy - copied
			if int64(n) > remain {
				n = int(remain)
			}
			c.Writer.Write(buf[:n])
			c.Writer.Flush()
			copied += int64(n)
		}
		if err != nil {
			if err == io.EOF {
				break
			}
			break
		}
	}
}
