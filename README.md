# 🔥 FireMaps-MapLibre-TS

Application de surveillance et visualisation spatiale des incendies en France.

![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite)
![MapLibre](https://img.shields.io/badge/MapLibre_GL-4.7-00B4D8?logo=maplibre)
![Node](https://img.shields.io/badge/Node.js-20-339933?logo=node.js)
![License](https://img.shields.io/badge/License-MIT-blue)

## Sources de données

| Source | Données | Fréquence |
|--------|---------|-----------|
| NASA FIRMS (VIIRS + MODIS) | Feux actifs, FRP | Temps réel |
| Copernicus EMS | Zones brûlées, risque | Quotidien |
| Météo-France | Vent, météo | 10 min |
| SDIS | Casernes pompiers | 24h |

## Stack technique

- **Frontend** : Vite · React 18 · TypeScript · TanStack Query v5 · Zustand v4 · MapLibre GL · Chart.js
- **Backend** : Express · TypeScript · Mongoose · Winston · node-cache
- **Base** : MongoDB

## Installation

### Prérequis

- Node.js ≥ 20
- MongoDB ≥ 7
- Clés API : [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/api/) · [Copernicus EMS](https://emergency.copernicus.eu/) · [Météo-France](https://api.meteo-france.com/)

### Backend

```bash
cd backend
cp .env.example .env   # Éditer avec vos clés
npm install
npm run dev
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```
### Docker

```bash
docker-compose up -d
```

### Scripts

|Commande|Description|
|--------|-----------|
|npm run dev|Lancer en développement|
|npm run build|Build de production|
|npm run typecheck|Vérification TypeScript|
|npm run preview|Prévisualiser le build|

### `docker-compose.yml`

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    env_file:
      - ./backend/.env
    volumes:
      - ./backend:/app
      - /app/node_modules
      - ./backend/exports:/app/exports
    depends_on:
      - mongodb
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=http://localhost:5000/api
    depends_on:
      - backend
    restart: unless-stopped

  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    restart: unless-stopped

volumes:
  mongodb_data:
```

### Licence
MIT © Sébastien Bats
