package utils

import "strings"

func UniqueStrings(slice []string) []string {
	seen := make(map[string]struct{})
	var result []string
	for _, s := range slice {
		s = strings.TrimSpace(s)
		if s == "" {
			continue
		}
		if _, ok := seen[s]; !ok {
			seen[s] = struct{}{}
			result = append(result, s)
		}
	}
	return result
}
