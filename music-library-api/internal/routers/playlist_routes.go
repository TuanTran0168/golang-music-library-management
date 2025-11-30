package router

import (
	"music-library-api/internal/handlers"

	"github.com/gin-gonic/gin"
)

func RegisterPlaylistRoutes(rg *gin.RouterGroup, handler *handlers.PlaylistHandler) {
	playlists := rg.Group("/playlists")
	{
		playlists.GET("/:id", handler.GetPlaylistByID)
		playlists.GET("", handler.GetPlaylists)
		playlists.POST("", handler.CreatePlaylist)
		playlists.PATCH("/:id", handler.UpdatePlaylist)
		playlists.DELETE("/:id", handler.DeletePlaylist)
		playlists.GET("/stream/:id", handler.StreamPlaylistM3U)
	}
}
