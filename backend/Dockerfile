# ✅ Utiliser Node.js 20 explicitement
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# Image de production
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

RUN mkdir -p exports logs

EXPOSE 5000

# Vérifier la version de Node.js au démarrage
RUN node --version

CMD ["node", "dist/server.js"]
