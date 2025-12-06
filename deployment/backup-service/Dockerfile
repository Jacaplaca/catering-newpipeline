# deployment/backup-service/Dockerfile
FROM node:22-alpine

# Instalujemy narzędzia systemowe: mongodb-tools (dla mongodump)
RUN apk add --no-cache mongodb-tools

WORKDIR /app

# Kopiujemy definicje zależności
COPY package.json ./

# Instalujemy zależności (bez devDeps nie pójdzie tsx, więc instalujemy wszystko)
RUN npm install

# Kopiujemy kod źródłowy i config TypeScript
COPY tsconfig.json ./
COPY src ./src

# Uruchamiamy bezpośrednio przez tsx (nie trzeba budować do JS w prostym serwisie)
CMD ["npm", "start"]