package utils

import "go.mongodb.org/mongo-driver/bson/primitive"

// Convert hex IDs to ObjectIDs
func ConvertToObjectIDs(ids []string) ([]primitive.ObjectID, error) {
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
