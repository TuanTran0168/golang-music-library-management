package repositories

import (
	"context"
	"music-library-api/internal/models"

	"github.com/kamva/mgm/v3"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type IUserRepository interface {
	GetUserByID(id string) (*models.User, error)
	GetUsers(page, limit int) ([]*models.User, error)
	CreateUser(user *models.User) (*models.User, error)
	UpdateUser(user *models.User) (*models.User, error)
	DeleteUser(id string) error
	FindByEmail(email string) (*models.User, error)
	AddFavoriteTrack(userID string, trackID primitive.ObjectID) error
	RemoveFavoriteTrack(userID string, trackID primitive.ObjectID) error
}

type userRepository struct {
	Collection *mongo.Collection
}

func NewUserRepository(db *mongo.Database) IUserRepository {
	return &userRepository{Collection: db.Collection("users")}
}

func (r *userRepository) GetUserByID(id string) (*models.User, error) {
	u := &models.User{}
	if err := mgm.Coll(u).FindByID(id, u); err != nil {
		return nil, err
	}
	return u, nil
}

func (r *userRepository) GetUsers(page, limit int) ([]*models.User, error) {
	users := []*models.User{}
	skip := int64((page - 1) * limit)
	opts := options.Find().SetSkip(skip).SetLimit(int64(limit))
	cursor, err := mgm.Coll(&models.User{}).Find(context.Background(), bson.M{}, opts)
	if err != nil {
		return nil, err
	}
	if err := cursor.All(context.Background(), &users); err != nil {
		return nil, err
	}
	return users, nil
}

func (r *userRepository) CreateUser(user *models.User) (*models.User, error) {
	if err := mgm.Coll(user).Create(user); err != nil {
		return nil, err
	}
	return user, nil
}

func (r *userRepository) UpdateUser(user *models.User) (*models.User, error) {
	if err := mgm.Coll(user).Update(user); err != nil {
		return nil, err
	}
	return user, nil
}

func (r *userRepository) DeleteUser(id string) error {
	u := &models.User{}
	if err := mgm.Coll(u).FindByID(id, u); err != nil {
		return err
	}
	return mgm.Coll(u).Delete(u)
}

func (r *userRepository) FindByEmail(email string) (*models.User, error) {
	u := &models.User{}
	if err := mgm.Coll(u).First(bson.M{"email": email}, u); err != nil {
		return nil, err
	}
	return u, nil
}

func (r *userRepository) AddFavoriteTrack(userID string, trackID primitive.ObjectID) error {
	id, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return err
	}
	filter := bson.M{"_id": id}
	update := bson.M{"$addToSet": bson.M{"favorite_track_ids": trackID}}
	_, err = r.Collection.UpdateOne(context.Background(), filter, update)
	return err
}

func (r *userRepository) RemoveFavoriteTrack(userID string, trackID primitive.ObjectID) error {
	id, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return err
	}
	filter := bson.M{"_id": id}
	update := bson.M{"$pull": bson.M{"favorite_track_ids": trackID}}
	_, err = r.Collection.UpdateOne(context.Background(), filter, update)
	return err
}
