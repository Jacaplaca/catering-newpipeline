# Zmieniamy bazę na Twój nowy obraz
FROM dziewan/t3-app-base:22-alpine AS deps

ARG PORT
ENV PORT ${PORT}
WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN ls -la
RUN npm install --legacy-peer-deps
RUN echo "DEPS stage DATABASE_URL=${DATABASE_URL}"

FROM dziewan/t3-app-base:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules

# Pobieramy wersję z package.json wcześnie, aby była dostępna dla builda
COPY package.json ./
RUN node -e "console.log(require('./package.json').version)" > .version
RUN export APP_VERSION=$(cat .version) && echo "APP_VERSION=$APP_VERSION" >> .env

# Add and extract fontawesome.tar
COPY --from=deps /usr/local/share/fontawesome.tar /tmp/fontawesome.tar
RUN ls -la /tmp && \
    mkdir -p /app/public && \
    tar -xf /tmp/fontawesome.tar -C /app/public && \
    ls -la /app/public && \
    rm /tmp/fontawesome.tar

COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN ls -la
RUN echo "BUILDER stage before db operations DATABASE_URL=${DATABASE_URL}"

# WAŻNE: Upewnij się, że w schema.prisma jest binaryTargets = ["native", "linux-musl-arm64-openssl-3.0.x"]
RUN npx prisma generate
RUN npx prisma db push
RUN npm run db:init
RUN npm run db:update
# Build korzysta ze zmiennych, upewnijmy się że APP_VERSION jest dostępna jeśli potrzebna
RUN export APP_VERSION=$(cat .version) && npm run build

FROM dziewan/t3-app-base:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

# Timezone config
ENV TZ=Europe/Warsaw
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

ENV NEXT_TELEMETRY_DISABLED 1
ENV CONTAINER docker

# --- ZMIANA KONIECZNA DLA ALPINE (User syntax) ---
RUN addgroup -S -g 1001 nodejs
RUN adduser -S -u 1001 -G nodejs nextjs
# -------------------------------------------------

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/.env ./.env
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder /app/deployment/health-check.mjs ./health-check.mjs
# Kopiujemy wersję aplikacji (opcjonalnie, dla celów informacyjnych)
COPY --from=builder /app/.version ./.version

VOLUME ["/app/.next/cache"]

HEALTHCHECK --interval=1m --timeout=3s --start-period=30s CMD node ./health-check.mjs

# Fix uprawnień (Alpine rzadziej tego wymaga, ale dla pewności zostawiamy strukturę)
USER root
RUN mkdir -p /app/.npm && chown -R nextjs:nodejs /app/.npm
USER nextjs

EXPOSE ${PORT}

CMD ["node", "server.js"]