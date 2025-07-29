# ✅ Dockerfile corrigé pour Render (avec OpenSSL legacy + Chromium)
FROM node:18-slim

# Chromium + dépendances pour Puppeteer
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    chromium \
    && apt-get clean

# Définir le chemin vers Chromium pour Puppeteer (si utilisé)
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Dossier de travail
WORKDIR /app

# Copie du projet
COPY . .

# Installation des dépendances
RUN npm install

# ✅ Lancement avec OpenSSL legacy
CMD ["node", "--openssl-legacy-provider", "server.js"]
