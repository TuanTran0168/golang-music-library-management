# 🎵 Music Library Management

A clean architecture **Music Library Management** application built with **Golang (Gin)** and **MongoDB**.  
It supports:  
- **CRUD** operations for **tracks** and **playlists**  
- **MP3 uploads** using **GridFS**  
- **Image uploads** using **Cloudinary**  
- **Search functionality**  
- **Simple MP3 streaming**



# 🚀 Run with Docker (Recommended)
#### 1️⃣ Go to project folder
```bash
cd music-library-api
```
> ⚠ **Important:** Make sure you are in the root folder of the project where 
> `docker-compose.yml` exists before running any `docker-compose` commands.

#### 2️⃣ Start MongoDB + Backend APIs
```bash
docker-compose up -d
```
This will automatically: 
- Start **MongoDB** 
- Build and run the **Backend API** 
- Expose your API at:  👉 **http://localhost:8080**

------------------------------------------------------------------------

# 📘 API Documentation (Swagger UI)

👉 **http://localhost:8080/swagger/index.html**

------------------------------------------------------------------------

# 🎧 Streaming APIs

### ▶ Stream a track (`.mp3`)
```bash
GET /api/tracks/{id}/stream
```

------------------------------------------------------------------------

# 📁 Project Structure

    ├── cmd
    │   └── main.go
    ├── configs/
    ├── docs/
    ├── internal/
    │   ├── dto/
    │   ├── handlers/
    │   ├── mappers/
    │   ├── models/
    │   ├── repositories/
    │   ├── routers/
    │   └── services/
    ├── pkg/
    │   ├── databases
    │   └── utils
    ├── uploads/
    │   ├── *.mp3
    ├── Dockerfile
    ├── Dockerfile.local
    ├── docker-compose.yaml
    ├── docker-compose-local.yaml
    └── run.sh

------------------------------------------------------------------------

# 🧹 Cleanup Docker System

### 🗑 Stop containers
```bash
docker-compose down
```

### 🗑 Remove containers, volumes, networks

```bash
docker-compose down -v
```
```bash
docker compose down -v --rmi all --remove-orphans
```


# ✔ Done!

Just run `docker-compose` and everything works out of the box.


# 🔧 Tech Stack
- **Golang 1.25.1** 🟦
- **Gin** ⚡ (HTTP web framework)
- **MongoDB** 🗄 (`mgm v3`, `GridFS`)
- **Cloudinary** ☁️ (Image upload)
- **Swagger** 📑 (API docs)
- **Docker & Docker compose** 🐳 (Containerization)
- **Audio Processing** 🎵 (`tag`, `go-mp3`)