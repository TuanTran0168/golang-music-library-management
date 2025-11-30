# 🎵 Music Library Management

A clean architecture Music Library Management built with **Golang (Gin)** and
**MongoDB**.
Supports CRUD for tracks/playlists, MP3 uploads, search, and **simple MP3
streaming**.

------------------------------------------------------------------------

### 🔧 Tech Stack
- **Golang 1.25.1** 🟦
- **Gin** ⚡ (HTTP web framework)
- **MongoDB** 🗄 (`mgm v3`, `GridFS`)
- **Cloudinary** ☁️ (Image upload)
- **Swagger** 📑 (API docs)
- **Docker & Docker compose** 🐳 (Containerization)
- **Audio Processing** 🎵 (`tag`, `go-mp3`)

# 🚀 Run with Docker (Recommended)

## 1️⃣ Start MongoDB + API
```bash
docker-compose -f docker-compose-local.yaml up -d
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

### ▶ Stream a track
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
    ├── Dockerfile.local
    ├── docker-compose-local.yaml
    └── run.sh

------------------------------------------------------------------------

# 🧹 Cleanup Docker System

### 🗑 Stop containers
```bash
docker-compose -f docker-compose-local.yaml down
```

### 🗑 Remove containers, volumes, networks

```bash
docker-compose -f docker-compose-local.yaml down -v
```
```bash
docker compose -f docker-compose-local.yml down -v --rmi all --remove-orphans
```


# ✔ Done!

Just run `docker-compose` and everything works out of the box.
