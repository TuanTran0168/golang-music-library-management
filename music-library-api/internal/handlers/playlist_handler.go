package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"music-library-api/internal/dto"
	"music-library-api/internal/mappers"
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

	resp := make([]dto.PlaylistResponse, len(playlists))
	for i, p := range playlists {
		resp[i] = mappers.ToPlaylistResponse(p)
		mappers.ToPlaylistResponse(p)
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
// @Accept       multipart/form-data
// @Produce      json
// @Param        title        formData string true  "Playlist title"
// @Param        album_cover  formData file   false "Album cover image"
// @Param        track_ids    formData []string false "Track IDs"
// @Success      201 {object} dto.PlaylistResponse
// @Failure      400 {object} map[string]string
// @Failure      500 {object} map[string]string
// @Router       /playlists [post]
func (h *PlaylistHandler) CreatePlaylist(c *gin.Context) {
	var req dto.CreatePlaylistRequest
	if err := c.ShouldBind(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var trackIDs []string
	if len(req.TrackIDs) > 0 {
		trackIDs = strings.Split(req.TrackIDs[0], ",")
	}

	objIDs, err := utils.ConvertToObjectIDs(trackIDs)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid track IDs"})
		return
	}

	playlist, err := h.service.CreatePlaylistFormData(&req, objIDs)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, playlist)
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

// @Summary      Stream playlist as M3U
// @Description  Streams an M3U playlist file containing URLs to the MP3 tracks.
// @Tags         Playlists
// @Produce      audio/x-mpegurl
// @Param        id   path     string  true  "Playlist ID"
// @Success      200  {string}  string  "M3U playlist content"
// @Failure      404  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /playlists/{id}/stream [get]
func (h *PlaylistHandler) StreamPlaylistM3U(c *gin.Context) {
	playlistID := c.Param("id")

	// The base path for the single track streaming endpoint.
	// This must match the endpoint defined in your track routes (e.g., /api/tracks/{id}/stream).
	const trackStreamBaseURL = "/api/tracks"

	fmt.Println("trackStreamBaseURL", trackStreamBaseURL)
	m3uContent, err := h.service.StreamPlaylistM3U(playlistID, trackStreamBaseURL)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to generate M3U playlist: %v", err)})
		return
	}

	// 1. Set the correct MIME type for M3U playlist files
	c.Header("Content-Type", "audio/x-mpegurl")
	// 2. Set Content-Disposition to attachment to suggest a filename for download
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"playlist_%s.m3u\"", playlistID))

	// 3. Write the M3U content directly as the HTTP response body
	c.String(http.StatusOK, m3uContent)
}
