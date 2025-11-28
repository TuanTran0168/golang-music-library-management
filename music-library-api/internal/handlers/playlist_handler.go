package handlers

import (
	"net/http"
	"strconv"

	"music-library-api/internal/models"
	"music-library-api/internal/services"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type PlaylistHandler struct {
	service services.IPlaylistService
}

func NewPlaylistHandler(service services.IPlaylistService) *PlaylistHandler {
	return &PlaylistHandler{service: service}
}

type CreatePlaylistRequest struct {
	Title      string   `json:"title" binding:"required"`
	AlbumCover string   `json:"album_cover"`
	TrackIDs   []string `json:"track_ids"`
}

type UpdatePlaylistRequest struct {
	Title      string   `json:"title"`
	AlbumCover string   `json:"album_cover"`
	TrackIDs   []string `json:"track_ids"`
}

// Helper: convert []string -> []primitive.ObjectID
func convertToObjectIDs(ids []string) ([]primitive.ObjectID, error) {
	objs := make([]primitive.ObjectID, len(ids))
	for i, idStr := range ids {
		objID, err := primitive.ObjectIDFromHex(idStr)
		if err != nil {
			return nil, err
		}
		objs[i] = objID
	}
	return objs, nil
}

// GET /playlists
func (h *PlaylistHandler) GetPlaylists(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	playlists, err := h.service.GetPlaylists(page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"page": page, "limit": limit, "data": playlists})
}

// POST /playlists
func (h *PlaylistHandler) CreatePlaylist(c *gin.Context) {
	var req CreatePlaylistRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	trackIDs, err := convertToObjectIDs(req.TrackIDs)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid track IDs"})
		return
	}

	pl := &models.Playlist{
		Title:      req.Title,
		AlbumCover: req.AlbumCover,
		TrackIDs:   trackIDs,
	}

	if err := h.service.CreatePlaylist(pl); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create playlist"})
		return
	}

	c.JSON(http.StatusCreated, pl)
}

// GET /playlists/:id
func (h *PlaylistHandler) GetPlaylistByID(c *gin.Context) {
	idStr := c.Param("id")

	pl, err := h.service.GetPlaylistByID(idStr)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, pl)
}

// PATCH /playlists/:id
func (h *PlaylistHandler) UpdatePlaylist(c *gin.Context) {
	idStr := c.Param("id")

	var req UpdatePlaylistRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	pl, err := h.service.GetPlaylistByID(idStr)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "playlist not found"})
		return
	}

	if req.Title != "" {
		pl.Title = req.Title
	}
	if req.AlbumCover != "" {
		pl.AlbumCover = req.AlbumCover
	}
	if len(req.TrackIDs) > 0 {
		trackIDs, err := convertToObjectIDs(req.TrackIDs)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid track IDs"})
			return
		}
		pl.TrackIDs = trackIDs
	}

	if err := h.service.UpdatePlaylist(pl); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update playlist"})
		return
	}

	c.JSON(http.StatusOK, pl)
}

// DELETE /playlists/:id
func (h *PlaylistHandler) DeletePlaylist(c *gin.Context) {
	idStr := c.Param("id")

	if err := h.service.DeletePlaylist(idStr); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}
