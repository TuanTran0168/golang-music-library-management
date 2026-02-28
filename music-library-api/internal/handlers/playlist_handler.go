package handlers

import (
	"errors"
	"fmt"
	"net/http"
	"strings"

	"music-library-api/internal/dto"
	"music-library-api/internal/mappers"
	"music-library-api/internal/services"
	"music-library-api/pkg/constants"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"
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
	page, limit := constants.ParsePagination(c.Query("page"), c.Query("limit"))

	uid := ""
	if c.Query("myPlaylists") == "true" {
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		uid = userID.(string)
	}

	playlists, err := h.service.GetPlaylists(page, limit, uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	totalCount, _ := h.service.CountPlaylists(uid)

	resp := make([]dto.PlaylistResponse, len(playlists))
	for i, p := range playlists {
		resp[i] = mappers.ToPlaylistResponse(p)
	}

	c.JSON(http.StatusOK, gin.H{
		"page":        page,
		"limit":       limit,
		"total_count": totalCount,
		"data":        resp,
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
// @Security     BearerAuth
// @Router       /playlists [post]
func (h *PlaylistHandler) CreatePlaylist(c *gin.Context) {
	var req dto.CreatePlaylistRequest
	if err := c.ShouldBind(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	playlist, err := h.service.CreatePlaylistFormData(userID.(string), &req)
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
// @Description  Update playlist by ID (partial update, form-data)
// @Tags         Playlists
// @Accept       multipart/form-data
// @Produce      json
// @Param        id           path     string true  "Playlist ID"
// @Param        title        formData string false "Playlist title"
// @Param        album_cover  formData file   false "Album cover image"
// @Param        track_ids    formData []string false "Track IDs, comma separated"
// @Param        mode         formData string false "Track update mode" Enums(append, overwrite) Default(append)
// @Success      200 {object} dto.PlaylistResponse
// @Failure      400 {object} map[string]string
// @Failure      404 {object} map[string]string
// @Failure      500 {object} map[string]string
// @Security     BearerAuth
// @Router       /playlists/{id} [patch]
func (h *PlaylistHandler) UpdatePlaylist(c *gin.Context) {
	idStr := c.Param("id")

	var req dto.UpdatePlaylistRequest
	if err := c.ShouldBind(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Ownership check: only owner or admin can update
	userID, _ := c.Get("user_id")
	role, _ := c.Get("role")
	pl, err := h.service.GetPlaylistByID(idStr)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "playlist not found"})
		return
	}
	if role != "admin" && pl.UserID.Hex() != userID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "you can only update your own playlists"})
		return
	}

	// Gọi service update, service sẽ handle upload file + trackIDs
	updatedPlaylist, err := h.service.UpdatePlaylistFormData(idStr, &req)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			c.JSON(http.StatusNotFound, gin.H{"error": "playlist not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, mappers.ToPlaylistResponse(updatedPlaylist))
}

// @Summary      Delete playlist
// @Description  Remove playlist by ID
// @Tags         Playlists
// @Accept       json
// @Produce      json
// @Param        id path string true "Playlist ID"
// @Success      204 {string} string "No Content"
// @Failure      500 {object} map[string]string
// @Security     BearerAuth
// @Router       /playlists/{id} [delete]
func (h *PlaylistHandler) DeletePlaylist(c *gin.Context) {
	idStr := c.Param("id")

	// Ownership check: only owner or admin can delete
	userID, _ := c.Get("user_id")
	role, _ := c.Get("role")
	pl, err := h.service.GetPlaylistByID(idStr)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "playlist not found"})
		return
	}
	if role != "admin" && pl.UserID.Hex() != userID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "you can only delete your own playlists"})
		return
	}

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
