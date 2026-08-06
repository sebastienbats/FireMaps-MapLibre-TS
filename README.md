# 🔥 FireMaps-MapLibre-TS

Application de surveillance et visualisation spatiale des incendies en France.

![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite)
![MapLibre](https://img.shields.io/badge/MapLibre_GL-4.7-00B4D8?logo=maplibre)
![Node](https://img.shields.io/badge/Node.js-20-339933?logo=node.js)
![License](https://img.shields.io/badge/License-MIT-blue)

<p align="center">
  <img src="https://img.shields.io/badge/React-18.2-61DAFB?style=flat&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.3-3178C6?style=flat&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-5.0-646CFF?style=flat&logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/MapLibre_GL-4.7-00B4D8?style=flat&logo=maplibre" alt="MapLibre" />
  <img src="https://img.shields.io/badge/Node.js-20-339933?style=flat&logo=node.js" alt="Node.js" />
  <img src="https://img.shields.io/badge/MongoDB-7.0-47A248?style=flat&logo=mongodb" alt="MongoDB" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=flat" alt="License" />
</p>

<h1 align="center">🔥 FireMaps France</h1>

<p align="center">
  Application de surveillance et de visualisation spatiale des incendies en France.<br/>
  Croisement en temps réel de données satellites, météorologiques et opérationnelles.
</p>

<p align="center">
  <a href="#-fonctionnalités">Fonctionnalités</a> ·
  <a href="#-sources-de-données">Sources de données</a> ·
  <a href="#-stack-technique">Stack</a> ·
  <a href="#-installation">Installation</a> ·
  <a href="#-api">API</a> ·
  <a href="#-déploiement-docker">Docker</a>
</p>

---

## 📸 Aperçu

<p align="center">
  <img src="./docs/screenshot-dark.png" alt="FireMaps - Mode sombre" width="90%" />
</p>

---

## ✨ Fonctionnalités

### 🛰️ Sources de données multi-satellites

| Source | Capteur / Produit | Données | Fréquence |
|--------|-------------------|---------|-----------|
| **NASA FIRMS** | VIIRS (N/N20) | Feux actifs, FRP, confiance | Temps réel (~15 min) |
| **NASA FIRMS** | MODIS (T/A) | Feux actifs (complément) | Temps réel |
| **Copernicus EMS** | Burned Areas | Zones brûlées, sévérité, surface | Quotidien |
| **Copernicus EMS** | Fire Risk | Zones à risque, indice de risque | Quotidien |
| **Météo-France** | Prévisions vent | Vitesse, direction, rafales | 10 minutes |
| **SDIS** | Casernes | Localisation, type, capacité | 24 heures |

### 🗺️ Visualisation cartographique

- **Heatmap dynamique** des feux actifs avec densité par zoom
- **Marqueurs proportionnels** dont la taille et la couleur dépendent du FRP (Fire Radiative Power)
- **Polygones Copernicus** pour les zones brûlées avec code couleur par sévérité
- **Zones à risque** Copernicus avec niveaux de risque gradués
- **Lignes de vent** Météo-France colorées par vitesse
- **Marqueurs SDIS** avec popups détaillés (département, type, contact)
- **Fond de carte** CARTO (Dark Matter / Positron) via MapLibre GL
- **Navigation** : zoom, pan, boussole, échelle métrique
- **Contraintes géographiques** : limites France métropolitaine

### 🚨 Système d'alertes intelligent

- **Feux extrêmes** : FRP > 100 MW (alerte haute), FRP > 200 MW (alerte critique)
- **Proximité SDIS** : feu à moins de 10 km d'une caserne avec FRP > 50 MW
- **Tendance journalière** : plus de 50 feux détectés dans la journée
- **Tri par sévérité** : critique → haute → moyenne → faible
- **Notifications toast** pour les alertes critiques
- **Panneau repliable** avec compteur et horodatage

### 📊 Analyse et graphiques

- **Graphique d'évolution** temporelle (nombre de feux + FRP total)
- **Double axe Y** : nombre de feux (gauche) et FRP en MW (droite)
- **Filtres temporels** : tout / 7 jours / 30 jours
- **Bascule** graphique en lignes / barres
- **Statistiques résumées** : total feux, FRP cumulé, FRP max

### 💾 Export de données

- **CSV** : export tabulaire avec échappement RFC 4180
- **GeoJSON** : export géospatial compatible QGIS / ArcGIS
- **Sauvegarde serveur** : fichiers stockés côté backend
- **Téléchargement local** : fichier téléchargé simultanément dans le navigateur

### 🎨 Interface utilisateur

- **Mode sombre / clair** avec transition fluide
- **Glassmorphism** : panneaux translucides avec backdrop-filter
- **Panneau de contrôle** avec toggles par source de données
- **Compteurs en temps réel** : nombre de feux, zones Copernicus, casernes SDIS
- **Indicateur de dernière mise à jour**
- **Responsive design** adapté desktop et tablette
- **Police Inter** pour une lisibilité optimale

### ⚡ Performance et état

- **Vite 5** : HMR < 100 ms, build optimisé avec code splitting
- **TanStack Query v5** : cache, retry exponentiel, refetch interval, devtools
- **Zustand v4** : state management global sans prop drilling
- **Memoization** : `useMemo` / `useCallback` sur les composants lourds
- **Nettoyage des marqueurs** : `useRef` + cleanup dans `useEffect` (zéro memory leak)
- **Code splitting** : chunks séparés pour MapLibre, Chart.js, React, TanStack

### 🔒 Sécurité

- **Helmet** : headers HTTP sécurisés (CSP, X-Frame-Options, etc.)
- **CORS strict** : origines autorisées via variable d'environnement
- **Rate limiting** : 100 requêtes / 15 min par IP
- **Clés API côté serveur** : jamais exposées au navigateur
- **Validation des entrées** : express-validator sur les routes sensibles
- **Protection path traversal** : `path.basename()` sur les exports
- **Limite de payload** : 10 Mo max par requête
- **Échappement CSV** : conformité RFC 4180

---

## 🛰️ Sources de données détaillées

### NASA FIRMS (VIIRS + MODIS)
- API : https://firms.modaps.eosdis.nasa.gov/api/country/csv
- Pays : FRA
- Capteurs : VIIRS (Suomi NPP / NOAA-20) + MODIS (Terra / Aqua)

| Champ | Description |
|-------|-------------|
| `latitude` / `longitude` | Position du feu |
| `brightness` | Température de brillance (K) |
| `frp` | Fire Radiative Power (MW) |
| `confidence` | Confiance de détection (%) |
| `satellite` | Satellite source (N, N20, T, A) |
| `instrument` | Capteur (VIIRS ou MODIS) |
| `daynight` | Détection diurne (D) ou nocturne (N) |
| `acq_date` / `acq_time` | Date et heure d'acquisition |

**Classification FRP :**

| FRP (MW) | Intensité | Classe | Couleur |
|----------|-----------|--------|---------|
| > 100 | Extrême | `extreme` | `#c0392b` |
| 50 – 100 | Élevée | `high` | `#e74c3c` |
| 20 – 50 | Modérée | `medium` | `#f39c12` |
| < 20 | Faible | `low` | `#f1c40f` |

### Copernicus EMS
- API : https://emergency.copernicus.eu/api/v1
- Produits : Burned Areas + Fire Risk

| Produit | Données | Usage |
|---------|---------|-------|
| **Burned Areas** | Polygones des zones brûlées, sévérité, surface (ha) | Cartographie post-incendie |
| **Fire Risk** | Zones à risque, indice de risque (0-1) | Prévention et anticipation |

**Sévérité des zones brûlées :**

| Surface (ha) | Sévérité | Couleur |
|-------------|----------|---------|
| > 1000 | `critical` | `#8B0000` |
| 500 – 1000 | `high` | `#B22222` |
| 100 – 500 | `medium` | `#CD853F` |
| < 100 | `low` | `#DEB887` |

### Météo-France
- API : https://api.meteo-france.com/v1
- Authentification : OAuth2 (client_credentials)

| Donnée | Description |
|--------|-------------|
| `wind_speed` | Vitesse du vent (km/h) |
| `wind_direction` | Direction du vent (degrés) |
| `wind_gust` | Rafales (km/h) |

**Code couleur du vent :**

| Vitesse (km/h) | Couleur |
|---------------|---------|
| 0 – 20 | `#3498db` (bleu) |
| 20 – 40 | `#2ecc71` (vert) |
| 40 – 60 | `#f39c12` (orange) |
| 60 – 80 | `#e74c3c` (rouge) |
| > 80 | `#8e44ad` (violet) |

### SDIS
- API : https://geo.api.gouv.fr/sdis
- Format : GeoJSON

| Champ | Description |
|-------|-------------|
| `name` | Nom de la caserne |
| `department` | Code département |
| `type` | `principal` ou `secondaire` |
| `capacity` | Capacité opérationnelle |
| `contact` | Coordonnées |

---

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

---

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
