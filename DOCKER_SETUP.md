# Docker Setup Guide

This guide will help you set up and run the Weather Dashboard application using Docker.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose (usually included with Docker Desktop)

## Quick Start

1. **Create environment file** (optional):
   ```bash
   cp .env.example .env
   ```
   Edit `.env` if you need to customize database credentials or other settings.

2. **Start all services**:
   ```bash
   docker compose up --build
   ```

3. **Access the application**:
   - Frontend: http://localhost
   - Backend API: http://localhost:3001

## Services

### MySQL Database
- **Port**: 3307 (external) → 3306 (internal)
- **Database**: `weatherDashboard` (default)
- **Root Password**: Set in `.env` file (default: `rootpassword`)
- **Initialization**: Automatically creates database and tables from `backend/init.sql`

### Backend API
- **Port**: 3001 (external) → 3000 (internal)
- **Container**: `weather-backend`
- **Health Check**: Waits for MySQL to be healthy before starting

### Frontend
- **Port**: 80
- **Container**: `weather-frontend`
- **Server**: Nginx serving the built React application

## Common Commands

### Start services
```bash
docker compose up
```

### Start in detached mode (background)
```bash
docker compose up -d
```

### Rebuild and start
```bash
docker compose up --build
```

### Stop services
```bash
docker compose down
```

### Stop and remove volumes
```bash
docker compose down -v
```

### View logs
```bash
# All services
docker compose logs

# Specific service
docker compose logs backend
docker compose logs frontend
docker compose logs mysql
```

### Restart a specific service
```bash
docker compose restart backend
```

## Database Access

To access the MySQL database directly:

```bash
docker exec -it weather-mysql mysql -u root -p
```

Enter the password from your `.env` file (default: `rootpassword`).

## Troubleshooting

### Port conflicts
If ports 80, 3001, or 3307 are already in use:
1. Stop the conflicting service, or
2. Modify the port mappings in `docker-compose.yml`

### Backend can't connect to MySQL
- Ensure MySQL container is healthy: `docker compose ps`
- Check MySQL logs: `docker compose logs mysql`
- Verify database credentials in `.env` file

### Frontend can't reach backend
- Ensure backend is running: `docker compose ps`
- Check backend logs: `docker compose logs backend`
- Verify `VITE_API_URL` in `.env` matches your backend URL

### Rebuild after code changes
```bash
# Rebuild specific service
docker compose build backend
docker compose build frontend

# Rebuild and restart
docker compose up --build
```

## Architecture

```
┌─────────────┐
│  Frontend   │ (Nginx on port 80)
│  (React)    │
└──────┬──────┘
       │
       │ HTTP requests
       │
┌──────▼──────┐
│   Backend   │ (Express on port 3000)
│   (Node.js) │
└──────┬──────┘
       │
       │ SQL queries
       │
┌──────▼──────┐
│    MySQL    │ (Database on port 3306)
│   (8.0)     │
└─────────────┘
```

All services communicate through the `weather-network` Docker network.

