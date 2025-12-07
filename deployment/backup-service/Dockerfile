FROM node:22-alpine

# Tylko mongodump
# Instalujemy toolsy, a potem usuwamy te niepotrzebne, aby odchudzić warstwę
RUN apk add --no-cache mongodb-tools && \
    rm -f /usr/bin/mongoimport \
          /usr/bin/mongoexport \
          /usr/bin/mongofiles \
          /usr/bin/mongostat \
          /usr/bin/mongotop \
          /usr/bin/bsondump \
          /usr/bin/mongorestore

WORKDIR /app

COPY package.json ./

# Instalacja tylko dependencies produkcyjnych + czyszczenie cache npm
RUN npm install --omit=dev && \
    npm cache clean --force

COPY src ./src

CMD ["node", "src/index.js"]
