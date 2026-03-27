# 🎵 Improok Music - Fullstack Music Library Management

A modern, high-performance **Music Library Management** application. Featuring a clean architecture **Golang** backend and a premium **Next.js** frontend.

[![Go Version](https://img.shields.io/badge/Go-1.25.1-00ADD8?style=flat&logo=go)](https://golang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.0.7-black?style=flat&logo=next.js)](https://nextjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?style=flat&logo=mongodb)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=flat&logo=docker)](https://www.docker.com/)

---

## ✨ Features

### 🔐 Authentication & Security
- **JWT-based Auth**: Secure access tokens with automatic rotation.
- **Refresh Tokens**: Stored in **HttpOnly Cookies** for maximum security against XSS.
- **Role-based Access**: Separate permissions for Users, Artists, and Admins.

### 🎧 Media Management
- **High-fidelity Streaming**: Custom MP3 streaming service via Golang.
- **GridFS Storage**: Efficiently handle large audio files directly in MongoDB.
- **Cloudinary Integration**: Blazing fast image uploads and transformations for avatars & covers.
- **Metadata Extraction**: Automatic ID3 tag parsing (Title, Artist, Duration) on upload.

### 🎨 Premium UI/UX
- **Modern Design**: Sleek, glassmorphic interface built with Next.js 16.
- **Dynamic Theming**: Smooth transition between **Dark** and **Light** modes.
- **Responsive Layout**: Optimized for desktop, tablet, and mobile devices.
- **Artist Studio**: Dedicated interface for creators to manage their tracks.

---

## 🛠 Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Backend** | **Golang (Gin)** | High-performance RESTful API |
| **Frontend** | **Next.js 16 (React 19)** | Server-side rendering & optimized client components |
| **Database** | **MongoDB** | NoSQL database with GridFS support |
| **Styling** | **Tailwind CSS 4** | Modern utility-first styling with PostCSS |
| **Auth** | **JWT & Cookies** | Secure session management |
| **API Docs** | **Swagger** | Interactive API documentation |
| **DevOps** | **Docker & Compose** | Seamless containerization |

---

## 📁 Project Structure

### 🖥️ Backend (music-library-api)
```text
├── backups/        # Database dumps (*.gz)
├── cmd/            # Application entry point (main.go)
├── configs/        # App configurations
├── docs/           # Swagger documentation
├── internal/       # Core business logic
│   ├── dto/        # Data Transfer Objects
│   ├── handlers/   # HTTP request handlers
│   ├── mappers/    # Entity to DTO mappers
│   ├── models/     # Database models
│   ├── repositories/# Database access layer
│   ├── routers/    # API routes definition
│   └── services/   # Business services
├── pkg/            # Reusable packages (databases, utils)
├── uploads/        # Local MP3 storage (*.mp3)
├── Dockerfile
├── Dockerfile.local
├── docker-compose.yaml
├── docker-compose-local.yaml
└── run.sh          # Helper script
```

### 🎨 Frontend (music-library-fe)
```text
├── app/            # Next.js App Router (pages & layouts)
├── components/     # UI elements (auth, track, layout, etc.)
├── hooks/          # Custom hooks (useTheme, etc.)
├── lib/            # Shared libraries (api, auth)
├── public/         # Static assets (images, icons)
├── types/          # TypeScript definitions
├── next.config.ts  # Next.js configuration
├── postcss.config.mjs
├── tailwind.config.ts
└── tsconfig.json   # TypeScript configuration
```

---

## 🚀 Quick Start

### 1️⃣ Backend Setup (Docker)

The easiest way to get started is using Docker Compose.

```bash
cd music-library-api
docker-compose up -d
```

- **API URL**: `http://localhost:8080`
- **Swagger UI**: `http://localhost:8080/swagger/index.html`

### 2️⃣ Frontend Setup

Ensure you have **Node.js 20+** installed.

```bash
cd music-library-fe
npm install
npm run dev
```

- **Frontend URL**: `http://localhost:3000`

---

## 💾 MongoDB Backup & Restore

> ⚠ **Important:** Ensure the `backups/` folder exists and is correctly mounted in the MongoDB container before running any backup or restore commands.

### 📦 Dump (Backup) the database

```bash
docker exec music_mongo_prod sh -c "mongodump --db music_library --username root --password Admin@123 --authenticationDatabase admin --archive=/dump/music_library_$(date +%Y%m%d_%H%M%S).gz --gzip"
```

**Example output:** `./backups/music_library_20251130_123456.gz`

### 🔄 Restore MongoDB Backup

> ⚠ **Important:** Replace the `<backup_file_name>` below with the actual backup file (e.g., `music_library_20251130_114415.gz`).

```bash
docker exec -i music_mongo_prod sh -c "mongorestore --username root --password Admin@123 --authenticationDatabase admin --archive=/dump/<backup_file_name>.gz --gzip --db music_library --drop"
```

---

## 📜 API Endpoints (Quick Reference)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | User registration |
| `POST` | `/api/auth/login` | Login & set HttpOnly cookie |
| `GET` | `/api/tracks` | Search & list tracks |
| `GET` | `/api/tracks/:id/stream` | High-speed MP3 streaming |
| `POST` | `/api/tracks/upload` | Upload new track (Artist only) |
| `GET` | `/api/playlists` | Manage user playlists |

---


## 🧹 Cleanup Docker System

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

---

### 💡 Developer Tips

- **Become an Admin**: To get admin privileges, use the `ADMIN_ROLE_KEY` (found in the backend `.env` files) when registering a new user.
- **Mock Data**: Use the `data-test` directory for testing with sample MP3s and metadata.

---

# ⭐ Done!
Happy coding! 🎧
