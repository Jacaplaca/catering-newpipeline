FROM node:22-alpine

# Only mongodump.
# Install tools, then remove the ones we don't need to keep the image smaller.
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

# Install production dependencies only + clean npm cache.
RUN npm install --omit=dev && \
    npm cache clean --force

COPY src ./src

CMD ["node", "src/index.js"]
