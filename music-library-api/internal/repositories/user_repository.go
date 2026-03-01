package repositories

import (
	"context"
	"errors"
	"music-library-api/internal/models"

	"github.com/kamva/mgm/v3"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type IUserRepository interface {
	CreateUser(user *models.User) error
	GetUserByEmail(email string) (*models.User, error)
	GetUserByID(id string) (*models.User, error)
	GetAllUsers(page, limit int) ([]*models.User, error)
	CountUsers() (int64, error)
	UpdateUser(user *models.User) error
	SaveRefreshToken(userID, token string) error
	GetUserByRefreshToken(token string) (*models.User, error)
	RevokeRefreshToken(userID string) error
}

type userRepository struct {
	Collection *mongo.Collection
}

func NewUserRepository(db *mongo.Database) IUserRepository {
	return &userRepository{
		Collection: db.Collection("users"),
	}
}

func (r *userRepository) CreateUser(user *models.User) error {
	return mgm.Coll(user).Create(user)
}

func (r *userRepository) GetUserByEmail(email string) (*models.User, error) {
	user := &models.User{}
	err := mgm.Coll(user).First(bson.M{"email": email}, user)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, nil // Not found
		}
		return nil, err
	}
	return user, nil
}

func (r *userRepository) GetUserByID(id string) (*models.User, error) {
	user := &models.User{}
	err := mgm.Coll(user).FindByID(id, user)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (r *userRepository) GetAllUsers(page, limit int) ([]*models.User, error) {
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

func (r *userRepository) CountUsers() (int64, error) {
	return mgm.Coll(&models.User{}).CountDocuments(context.Background(), bson.M{})
}

func (r *userRepository) UpdateUser(user *models.User) error {
	return mgm.Coll(user).Update(user)
}

func (r *userRepository) SaveRefreshToken(userID, token string) error {
	oid, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return err
	}
	_, err = mgm.Coll(&models.User{}).UpdateOne(
		context.Background(),
		bson.M{"_id": oid},
		bson.M{"$set": bson.M{"refresh_token": token}},
	)
	return err
}

func (r *userRepository) GetUserByRefreshToken(token string) (*models.User, error) {
	user := &models.User{}
	err := mgm.Coll(user).First(bson.M{"refresh_token": token}, user)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, nil
		}
		return nil, err
	}
	return user, nil
}

func (r *userRepository) RevokeRefreshToken(userID string) error {
	return r.SaveRefreshToken(userID, "")
}
