package constants

import "strconv"

const (
	DefaultPage     = 1
	DefaultPageSize = 12
	MaxPageSize     = 100
)

// ParsePagination parses page and limit from query strings with safe defaults.
func ParsePagination(pageStr, limitStr string) (int, int) {
	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = DefaultPage
	}

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 1 {
		limit = DefaultPageSize
	}
	if limit > MaxPageSize {
		limit = MaxPageSize
	}

	return page, limit
}
