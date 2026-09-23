# An Pardaz Mobile Frontend — Docker

This directory is the current mobile-oriented frontend. It is a React + Vite application (not an Expo/React-Native native project).

## Development with Docker

From this directory:

```bash
docker compose -f docker-compose.dev.yml up --build
```

Open:

- http://localhost:5175

The source directory is bind-mounted, so Vite hot reload remains active while editing files.

The An Sarraf API defaults to:

```
VITE_ANSARRAF_API_URL=http://localhost:4002
```

Override it when the API is elsewhere:

```VITE_ANSARRAF_API_URL=https://your-api.example.com docker compose -f docker-compose.dev.yml up --build
```

Stop:

```bash
docker compose -f docker-compose.dev.yml down
```

## Production-like static container

The existing `Dockerfile` + `docker-compose.yml` build the Vite app and serve `dist` through nginx on port 5175.

```bash
docker compose up --build -d
```

Health endpoint:

```
http://localhost:5175/health
```
