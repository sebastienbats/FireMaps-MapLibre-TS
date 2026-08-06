# 🔥 FireMaps-MapLibre-TS

Application de surveillance et visualisation spatiale des incendies en France.

![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite)
![MapLibre](https://img.shields.io/badge/MapLibre_GL-4.7-00B4D8?logo=maplibre)
![Node](https://img.shields.io/badge/Node.js-20-339933?logo=node.js)
![License](https://img.shields.io/badge/License-MIT-blue)

## 📁 Structure du projet
```text
FireMaps-MapLibre-TS/
├── .gitignore
├── README.md
├── docker-compose.yml
│
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── nodemon.json
│   ├── .env.example
│   └── src/
│       ├── server.ts                  # Point d'entrée Express
│       ├── config/
│       │   ├── database.ts            # Connexion MongoDB
│       │   └── logger.ts              # Winston logger
│       ├── types/                     # Types TypeScript partagés
│       │   ├── geojson.types.ts
│       │   ├── fire.types.ts
│       │   ├── copernicus.types.ts
│       │   ├── meteo.types.ts
│       │   ├── sdis.types.ts
│       │   ├── export.types.ts
│       │   └── index.ts
│       ├── middleware/
│       │   ├── rateLimiter.ts         # Rate limiting
│       │   ├── errorHandler.ts        # Gestion erreurs globale
│       │   └── validator.ts           # Validation entrées
│       ├── services/                  # Logique métier + cache
│       │   ├── firmsService.ts        # NASA FIRMS (VIIRS + MODIS)
│       │   ├── copernicusService.ts   # Copernicus EMS
│       │   ├── meteoFranceService.ts  # Météo-France
│       │   └── sdisService.ts         # SDIS
│       ├── controllers/               # Contrôleurs HTTP
│       │   ├── fireController.ts
│       │   ├── copernicusController.ts
│       │   ├── meteoController.ts
│       │   ├── sdisController.ts
│       │   └── exportController.ts
│       ├── models/
│       │   └── FireHistory.ts         # Schéma Mongoose
│       └── routes/                    # Routes Express
│           ├── fires.ts
│           ├── copernicus.ts
│           ├── meteo.ts
│           ├── sdis.ts
│           └── exports.ts
│
└── frontend/
    ├── package.json
    ├── tsconfig.json
    ├── tsconfig.node.json
    ├── vite.config.ts                 # Config Vite + proxy
    ├── index.html                     # Point d'entrée HTML
    ├── .env.example
    └── src/
        ├── vite-env.d.ts              # Types Vite
        ├── main.tsx                   # Bootstrap React + QueryClient
        ├── App.tsx                    # Composant racine
        ├── App.css
        ├── index.css
        ├── types/                     # Types TypeScript frontend
        │   ├── fire.types.ts
        │   ├── copernicus.types.ts
        │   ├── meteo.types.ts
        │   ├── sdis.types.ts
        │   ├── map.types.ts
        │   ├── api.types.ts
        │   └── index.ts
        ├── store/                     # Zustand stores
        │   ├── mapStore.ts            # Couches + thème
        │   └── alertStore.ts          # Alertes
        ├── services/
        │   └── api.ts                 # Client Axios
        ├── hooks/                     # TanStack Query hooks
        │   ├── useFireData.ts
        │   ├── useCopernicusData.ts
        │   ├── useMeteoData.ts
        │   └── useSdisData.ts
        ├── utils/
        │   ├── csvUtils.ts            # Échappement CSV
        │   └── geoUtils.ts            # Haversine
        └── components/
            ├── Map/                   # Couches cartographiques
            │   ├── Map.tsx
            │   ├── Map.css
            │   ├── FireLayer.tsx
            │   ├── CopernicusLayer.tsx
            │   ├── WindLayer.tsx
            │   ├── SdisLayer.tsx
            │   └── index.ts
            ├── Controls/              # Panneau de contrôle
            │   ├── Controls.tsx
            │   ├── Controls.css
            │   ├── LayerToggle.tsx
            │   └── index.ts
            ├── Alerts/                # Système d'alertes
            │   ├── Alerts.tsx
            │   ├── Alerts.css
            │   └── index.ts
            └── Charts/                # Graphiques
                ├── FireChart.tsx
                ├── FireChart.css
                └── index.ts
```           

## Sources de données

| Source | Données | Fréquence |
|--------|---------|-----------|
| NASA FIRMS (VIIRS + MODIS) | Feux actifs, FRP | Temps réel |
| Copernicus EMS | Zones brûlées, risque | Quotidien |
| Météo-France | Vent, météo | 10 min |
| SDIS | Casernes pompiers | 24h |

## Stack technique

## 🏗️ Stack technique

### Frontend

| Technologie | Version | Rôle |
|-------------|---------|------|
| **React** | 18.2 | Framework UI |
| **TypeScript** | 5.3 | Typage statique strict |
| **Vite** | 5.0 | Build tool + dev server |
| **TanStack Query** | 5.17 | Fetching, cache, synchronisation |
| **Zustand** | 4.4 | State management global |
| **MapLibre GL** | 4.7 | Rendu cartographique WebGL |
| **Chart.js** | 4.4 | Graphiques d'évolution |
| **Axios** | 1.6 | Client HTTP |
| **react-hot-toast** | 2.4 | Notifications |

### Backend

| Technologie | Version | Rôle |
|-------------|---------|------|
| **Node.js** | 20+ | Runtime serveur |
| **Express** | 4.18 | Framework HTTP |
| **TypeScript** | 5.3 | Typage statique strict |
| **Mongoose** | 8.0 | ODM MongoDB |
| **Axios** | 1.6 | Client HTTP (proxy API) |
| **node-cache** | 5.1 | Cache mémoire TTL |
| **csv-parse** | 5.5 | Parsing données FIRMS |
| **Winston** | 3.11 | Logging structuré |
| **Helmet** | 7.1 | Sécurité HTTP |
| **express-rate-limit** | 7.1 | Rate limiting |
| **express-validator** | 7.0 | Validation entrées |

### Base de données

| Technologie | Version | Rôle |
|-------------|---------|------|
| **MongoDB** | 7.0 | Stockage historique des feux |

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
