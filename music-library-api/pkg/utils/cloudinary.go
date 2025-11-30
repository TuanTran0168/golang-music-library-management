package utils

import (
	"context"
	"fmt"
	"mime/multipart"
	config "music-library-api/configs"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
)

type CloudinaryUtil struct {
	cld *cloudinary.Cloudinary
}

func NewCloudinaryUtil(cfg *config.Config) (*CloudinaryUtil, error) {
	cld, err := cloudinary.NewFromParams(cfg.CloudName, cfg.APIKey, cfg.APISecret)
	if err != nil {
		return nil, err
	}
	return &CloudinaryUtil{cld: cld}, nil
}

func (c *CloudinaryUtil) UploadImage(file multipart.File, fileHeader *multipart.FileHeader, folder string) (string, error) {
	ctx := context.Background()
	result, err := c.cld.Upload.Upload(ctx, file, uploader.UploadParams{
		PublicID: fileHeader.Filename,
		Folder:   folder,
	})
	if err != nil {
		return "", fmt.Errorf("cloudinary upload failed: %w", err)
	}
	return result.SecureURL, nil
}
