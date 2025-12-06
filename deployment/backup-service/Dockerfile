FROM node:22-alpine

# Tylko mongodump
RUN apk add --no-cache mongodb-tools

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY src ./src

CMD ["npm", "start"]