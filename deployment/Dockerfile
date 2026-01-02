# ======================================================
# deps — install node dependencies (build base)
# ======================================================
FROM dziewan/t3-app-base:build-22-alpine AS deps

ARG PORT
ENV PORT=${PORT}
WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma

# >>> ENABLE NPM CACHE (BuildKit)
RUN --mount=type=cache,target=/root/.npm \
    npm install --legacy-peer-deps

# ======================================================
# builder — Next.js build (build base)
# ======================================================
FROM dziewan/t3-app-base:build-22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

# App version (optional, informational)
COPY package.json ./
RUN node -e "console.log(require('./package.json').version)" > .version

# Font Awesome (only at build time)
COPY --from=deps /usr/local/share/fontawesome.tar /tmp/fontawesome.tar
RUN mkdir -p /app/public && \
    tar -xf /tmp/fontawesome.tar -C /app/public && \
    rm /tmp/fontawesome.tar

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN npx prisma generate

# Build with safe dummy DATABASE_URL
# >>> ENABLE NPM CACHE (BuildKit)
RUN --mount=type=cache,target=/root/.npm \
    export APP_VERSION="$(node -p "require('./package.json').version")" && \
    DATABASE_URL="mongodb://127.0.0.1:27017/build" \
    SKIP_ENV_VALIDATION=1 \
    SKIP_SCHEDULERS=1 \
    SKIP_EXTERNAL_DOWNLOADS=1 \
    APP_VERSION="$APP_VERSION" \
    NODE_OPTIONS="--max-old-space-size=6144" \
    npm run build

# ======================================================
# dbtools — Prisma / TSX only (runtime base)
# ======================================================
FROM dziewan/t3-app-base:runtime-22-alpine AS dbtools
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate

CMD ["sh"]

# ======================================================
# runner — minimal runtime image (runtime base)
# ======================================================
FROM dziewan/t3-app-base:runtime-22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV CONTAINER=docker
ENV NEXT_TELEMETRY_DISABLED=1

# --- App artifacts (standalone) ---
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder /app/.version ./.version

# --- Runtime scripts ---
COPY --chown=nextjs:nodejs deployment/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

COPY --from=builder /app/deployment/health-check.mjs ./health-check.mjs

VOLUME ["/app/.next/cache"]

HEALTHCHECK --interval=1m --timeout=3s --start-period=30s \
  CMD node ./health-check.mjs

EXPOSE ${PORT}

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["node", "server.js"]
