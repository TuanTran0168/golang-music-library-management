# 🎵 Music Library Management

A clean architecture **Music Library Management** application built with **Golang (Gin)** and **MongoDB**.  
It supports:

-   **CRUD** operations for **tracks** and **playlists**
-   **MP3 uploads** using **GridFS**
-   **Image uploads** using **Cloudinary**
-   **Search functionality**
-   **Simple MP3 streaming**

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

-   Start **MongoDB**
-   Build and run the **Backend API**
-   🌐 Expose your API at: **http://localhost:8080**

-   📘 API Documentation (Swagger UI): **http://localhost:8080/swagger/index.html**

---

# 💾 MongoDB Backup & Restore

> ⚠ **Important:** Ensure the `backups/` folder exists and is correctly mounted in the MongoDB container before running any backup or restore commands.

## 📦 Dump (Backup) the database

```bash
docker exec music_mongo_prod sh -c "mongodump --db music_library --username root --password Admin@123 --authenticationDatabase admin --archive=/dump/music_library_$(date +%Y%m%d_%H%M%S).gz --gzip"
```

### 📌 Example output file

```bash
./backups/music_library_20251130_123456.gz
```

## 🔄 Restore MongoDB Backup

> ⚠ **Important:** Replace the `backup_file_name` below with the actual backup file you want to restore.

> 💡 **Example Backup File Name** (you can repalce): `music_library_20251130_114415.gz`

```bash
docker exec -i music_mongo_prod sh -c "mongorestore --username root --password Admin@123 --authenticationDatabase admin --archive=/dump/<backup_file_name>.gz --gzip --db music_library --drop"
```

---

# 🎧 Streaming APIs

### ▶ Stream a track (`.mp3`)

```bash
GET /api/tracks/{id}/stream
```

---

# 📁 Project Structure

    ├── backups/
    │   └── *.gz
    ├── cmd/
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

---

# 🧹 Cleanup Docker System

### 🛑 Stop containers

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

# ⭐ Done! ✔

Just run `docker-compose` and everything works out of the box.

# 🔧 Tech Stack

-   **Golang 1.25.1** 🟦
-   **Gin** ⚡ (HTTP web framework)
-   **MongoDB** 🗄 (`mgm v3`, `GridFS`)
-   **Cloudinary** ☁️ (Image upload)
-   **Swagger** 📑 (API docs)
-   **Docker & Docker compose** 🐳 (Containerization)
-   **Audio Processing** 🎵 (`tag`, `go-mp3`)
