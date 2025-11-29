package handlers

import (
	"fmt"
	"net/http"
	"strconv"

	"music-library-api/internal/dto"
	"music-library-api/internal/mappers"
	"music-library-api/internal/models"
	"music-library-api/internal/services"
	"music-library-api/pkg/utils"

	"github.com/gin-gonic/gin"
)

type PlaylistHandler struct {
	service services.IPlaylistService
}

func NewPlaylistHandler(service services.IPlaylistService) *PlaylistHandler {
	return &PlaylistHandler{service: service}
}

// @Summary      Get all playlists
// @Description  Retrieve paginated playlists
// @Tags         Playlists
// @Accept       json
// @Produce      json
// @Param        page  query int false "Page number"
// @Param        limit query int false "Page size"
// @Success      200 {object} map[string]interface{}
// @Router       /playlists [get]
func (h *PlaylistHandler) GetPlaylists(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	playlists, err := h.service.GetPlaylists(page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// show playlist info
	for _, p := range playlists {
		fmt.Println(p.TrackIDs)
	}

	resp := make([]dto.PlaylistResponse, len(playlists))
	for i, p := range playlists {
		resp[i] = mappers.ToPlaylistResponse(p)
	}

	c.JSON(http.StatusOK, gin.H{
		"page":  page,
		"limit": limit,
		"data":  resp,
	})
}

// @Summary      Create playlist
// @Description  Create new playlist
// @Tags         Playlists
// @Accept       json
// @Produce      json
// @Param        payload body dto.CreatePlaylistRequest true "Playlist data"
// @Success      201 {object} dto.PlaylistResponse
// @Failure      400 {object} map[string]string
// @Failure      500 {object} map[string]string
// @Router       /playlists [post]
func (h *PlaylistHandler) CreatePlaylist(c *gin.Context) {
	var req dto.CreatePlaylistRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	trackIDs, err := utils.ConvertToObjectIDs(req.TrackIDs)
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

	c.JSON(http.StatusCreated, mappers.ToPlaylistResponse(pl))
}

// @Summary      Get playlist by ID
// @Description  Get playlist detail
// @Tags         Playlists
// @Accept       json
// @Produce      json
// @Param        id path string true "Playlist ID"
// @Success      200 {object} dto.PlaylistResponse
// @Failure      404 {object} map[string]string
// @Router       /playlists/{id} [get]
func (h *PlaylistHandler) GetPlaylistByID(c *gin.Context) {
	idStr := c.Param("id")

	pl, err := h.service.GetPlaylistByID(idStr)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, mappers.ToPlaylistResponse(pl))
}

// @Summary      Update playlist
// @Description  Update playlist by ID
// @Tags         Playlists
// @Accept       json
// @Produce      json
// @Param        id path string true "Playlist ID"
// @Param        payload body dto.UpdatePlaylistRequest true "Playlist update"
// @Success      200 {object} dto.PlaylistResponse
// @Failure      400 {object} map[string]string
// @Failure      404 {object} map[string]string
// @Failure      500 {object} map[string]string
// @Router       /playlists/{id} [patch]
func (h *PlaylistHandler) UpdatePlaylist(c *gin.Context) {
	idStr := c.Param("id")

	var req dto.UpdatePlaylistRequest
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
		trackIDs, err := utils.ConvertToObjectIDs(req.TrackIDs)
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

	c.JSON(http.StatusOK, mappers.ToPlaylistResponse(pl))
}

// @Summary      Delete playlist
// @Description  Remove playlist by ID
// @Tags         Playlists
// @Accept       json
// @Produce      json
// @Param        id path string true "Playlist ID"
// @Success      204 {string} string "No Content"
// @Failure      500 {object} map[string]string
// @Router       /playlists/{id} [delete]
func (h *PlaylistHandler) DeletePlaylist(c *gin.Context) {
	idStr := c.Param("id")

	if err := h.service.DeletePlaylist(idStr); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}
