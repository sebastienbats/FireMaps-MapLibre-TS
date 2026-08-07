# 🔥 FireMaps-MapLibre-TS

Application de surveillance et visualisation spatiale des incendies en France.

![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite)
![MapLibre](https://img.shields.io/badge/MapLibre_GL-4.7-00B4D8?logo=maplibre)
![Node](https://img.shields.io/badge/Node.js-20-339933?logo=node.js)
![License](https://img.shields.io/badge/License-MIT-blue)

## ✨ Fonctionnalités

- 🛰️ **NASA FIRMS** : Feux actifs VIIRS + MODIS en temps réel
- 🔥 **Zones brûlées** : NASA FIRMS MCD64A1 (mensuel)
- ⚠️ **Risque incendie** : EFFIS Fire Weather Index (JRC)
- 🌬️ **Vent** : Météo-France AROME/ARPEGE via Open-Meteo
- 🚒 **SDIS** : Casernes de pompiers via OpenStreetMap
- 🚨 **Alertes** : Détection automatique feux extrêmes et proximité SDIS
- 📊 **Graphiques** : Évolution temporelle des feux et FRP
- 💾 **Export** : CSV et GeoJSON

### 🛰️ Sources de données

| Source | Données | Fréquence | Auth |
|--------|---------|-----------|------|
| NASA FIRMS | Feux actifs (VIIRS + MODIS) | ~15 min | Clé API |
| NASA FIRMS MCD64A1 | Zones brûlées | Mensuel | Clé API |
| EFFIS (JRC) | Risque incendie (FWI) | Quotidien | Aucune |
| Open-Meteo | Vent (Météo-France AROME) | 1h | Aucune |
| OpenStreetMap | Casernes SDIS | Statique | Aucune |
| CARTO | Fond de carte | Statique | Aucune |

### 🗺️ Visualisation cartographique

- **Heatmap dynamique** des feux actifs avec densité par zoom
- **Marqueurs proportionnels** dont la taille et la couleur dépendent du FRP
- **Polygones de zones brûlées** avec code couleur par sévérité
- **Zones à risque** EFFIS avec niveaux de risque gradués
- **Lignes de vent** Météo-France colorées par vitesse
- **Marqueurs SDIS** avec popups détaillés
- **Fond de carte** CARTO (Dark Matter / Positron) via MapLibre GL
- **Navigation** : zoom, pan, boussole, échelle métrique
- **Contraintes géographiques** : limites France métropolitaine

### 🚨 Système d'alertes intelligent

- **Feux extrêmes** : FRP > 100 MW (haute), FRP > 200 MW (critique)
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
- **Téléchargement local** : fichier téléchargé simultanément

### 🎨 Interface utilisateur

- **Mode sombre / clair** avec transition fluide
- **Glassmorphism** : panneaux translucides avec backdrop-filter
- **Panneau de contrôle** avec toggles par source de données
- **Compteurs en temps réel** : feux, zones brûlées, casernes SDIS
- **Indicateur de dernière mise à jour**
- **Police Inter** pour une lisibilité optimale

### ⚡ Performance et état

- **Vite 5** : HMR < 100 ms, build optimisé avec code splitting
- **TanStack Query v5** : cache, retry exponentiel, refetch interval, devtools
- **Zustand v4** : state management global sans prop drilling
- **Memoization** : `useMemo` / `useCallback` sur les composants lourds
- **Nettoyage des marqueurs** : `useRef` + cleanup dans `useEffect`
- **Code splitting** : chunks séparés pour MapLibre, Chart.js, React, TanStack

### 🔒 Sécurité

- **Helmet** : headers HTTP sécurisés
- **CORS strict** : origines autorisées via variable d'environnement
- **Rate limiting** : 100 requêtes / 15 min par IP
- **Clés API côté serveur** : jamais exposées au navigateur
- **Validation des entrées** : express-validator sur les routes sensibles
- **Protection path traversal** : `path.basename()` sur les exports
- **Limite de payload** : 10 Mo max par requête

---

## 🛰️ Sources de données détaillées

### NASA FIRMS (VIIRS + MODIS + MCD64A1)
- API : https://firms.modaps.eosdis.nasa.gov/api/country/csv/{KEY}/{COUNTRY}/{DAYS}
- Burned : https://firms.modaps.eosdis.nasa.gov/api/burned/csv/{KEY}/{COUNTRY}/{YEAR}/{MONTH}
- Pays : FRA
- Format : CSV
- Auth : Clé API dans l'URL (pas de header Authorization)

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

**Inscription clé API :**

| Champ | Valeur |
|-------|--------|
| URL | `https://firms.modaps.eosdis.nasa.gov/api/area/` |
| Étapes | Remplir le formulaire → recevoir la clé par email |
| Gratuit | ✅ Oui |
| Quota | Illimité pour usage raisonnable |

### EFFIS — European Forest Fire Information System
- API : https://effis.jrc.ec.europa.eu/
- Produit : Fire Weather Index (FWI)
- Format : JSON / GeoJSON
- Auth : ❌ Aucune clé requise

| Champ | Description |
|-------|-------------|
| `fwi` | Fire Weather Index (0-100+) |
| `lat` / `lon` | Position de la mesure |

**Classification FWI :**

| FWI | Niveau de risque | Couleur |
|-----|-----------------|---------|
| > 50 | Extrême | `#FF0000` |
| 30 – 50 | Élevé | `#FF4500` |
| 15 – 30 | Modéré | `#FFA500` |
| < 15 | Faible | `#FFFF00` |

**Inscription :**

| Champ | Valeur |
|-------|--------|
| URL | `https://effis.jrc.ec.europa.eu/` |
| Clé API | ❌ Non requise |
| Gratuit | ✅ Oui |

### Open-Meteo API (proxy Météo-France)
- API : https://api.open-meteo.com/v1/meteofrance
- Source : Météo-France AROME/ARPEGE via Open-Meteo
- Format : JSON
- Auth : ❌ Aucune clé requise
- Quota : 10 000 appels/jour (gratuit non commercial)

| Donnée | Paramètre | Unité |
|--------|-----------|-------|
| Vitesse vent | `wind_speed_10m` | km/h, m/s, mph, knots |
| Direction vent | `wind_direction_10m` | degrés (0-360) |
| Rafales | `wind_gusts_10m` | km/h, m/s, mph, knots |
| Température | `temperature_2m` | °C, °F |
| Humidité | `relative_humidity_2m` | % |
| Précipitations | `precipitation` | mm, inch |

**Inscription :**

| Champ | Valeur |
|-------|--------|
| URL | `https://open-meteo.com/` |
| Clé API | ❌ Non requise |
| Gratuit | ✅ Oui (non commercial) |
| Documentation | `https://open-meteo.com/en/docs/meteofrance-api` |

### OpenStreetMap — Casernes SDIS
- API : https://overpass-api.de/api/interpreter
- Miroir : https://overpass.kumi.systems/api/interpreter
- Tag OSM : amenity=fire_station
- Format : JSON
- Auth : ❌ Aucune clé requise

| Champ | Description |
|-------|-------------|
| `name` | Nom de la caserne |
| `operator` | Opérateur (SDIS, BSPP, BMPM) |
| `phone` | Téléphone |
| `fire_station` | Type (wildfire, etc.) |

**Inscription :**

| Champ | Valeur |
|-------|--------|
| URL | `https://overpass-api.de/` |
| Clé API | ❌ Non requise |
| Gratuit | ✅ Oui |

### CARTO Basemaps
- Dark : https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json
- Light : https://basemaps.cartocdn.com/gl/positron-gl-style/style.json
- Auth : ❌ Aucune clé requise (usage non commercial)

| Champ | Valeur |
|-------|--------|
| URL inscription | `https://carto.com/signup/` |
| Clé API | ❌ Non requise pour les styles publics |
| Gratuit | ✅ Oui (usage non commercial) |

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

## Installation

### Prérequis

- Node.js ≥ 20
- MongoDB ≥ 7
  #### Etape 1. Installer MongoDB local (Ubuntu/Debian)
   ```bash
    # Importer la clé GPG
    curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
    sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

    # Ajouter le dépôt MongoDB
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
    sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    # Installer
    sudo apt-get update
    sudo apt-get install -y mongodb-org
   ```
#### Étape 2 — Démarrer MongoDB
   ```bash
    # Démarrer le service
    sudo systemctl start mongod
    # Activer au démarrage
    sudo systemctl enable mongod
    # Vérifier le statut
    sudo systemctl status mongod
   ```
#### Étape 3 — Vérifier la connexion
   ```bash
    # Se connecter au shell MongoDB
    mongosh
    # Dans le shell, vérifier que ça fonctionne
    > db.runCommand({ ping: 1 })
    { ok: 1 }
    # Quitter
    > exit
   ```
#### Étape 4 — Créer la base de données FireMaps
   ```bash
    mongosh
   ```
   ```javascript
    // Créer la base et un utilisateur (optionnel pour le dev)
    use firemaps
    // Créer une collection de test
    db.test.insertOne({ message: "FireMaps MongoDB fonctionne !" })
    // Vérifier
    db.test.find()
    // Quitter
    exit
   ```
#### Étape 5 — Configurer le .env
   ```env
    # backend/.env
    MONGODB_URI=mongodb://localhost:27017/firemaps
   ```
  - Clé API NASA FIRMS : [inscription](https://firms.modaps.eosdis.nasa.gov/api/area/)

### 🚀 Démarrage rapide
```bash
# 1. Cloner le projet
git clone https://github.com/sebastienbats/FireMaps-MapLibre-TS.git
cd FireMaps-MapLibre-TS

# 2. Backend
cd backend
cp .env.example .env
# Éditer .env avec votre clé FIRMS_API_KEY
npm install
npm run dev

# 3. Frontend (nouveau terminal)
cd ../frontend
cp .env.example .env
npm install
npm run dev

# 4. Vérification
curl http://localhost:5000/api/health
```
### Scripts

|Commande|Description|
|--------|-----------|
|npm run dev|Lancer en développement|
|npm run build|Build de production|
|npm run typecheck|Vérification TypeScript|
|npm run preview|Prévisualiser le build|

### Avec Docker

```bash
cp backend/.env.example backend/.env
# Éditer backend/.env
docker-compose up -d
```

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

---

## 🔌 API
|Endpoint|Description|
|--------|-----------|
|GET /api/health|État du serveur|
|GET /api/fires?days=1|Feux actifs (VIIRS + MODIS)|
|GET /api/copernicus/burned-areas|Zones brûlées|
|GET /api/copernicus/fire-risk|Zones à risque|
|GET /api/meteo/wind|Données de vent|
|GET /api/sdis|Casernes SDIS|

---

### Licence
MIT © Sébastien Bats
