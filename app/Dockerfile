FROM node:24-alpine
WORKDIR /app

COPY app/package.json ./
RUN npm install --package-lock-only && npm ci

FROM node:18-alpine AS prod-deps
WORKDIR /app
COPY app/package.json ./
COPY --from=deps /app/package-lock.json ./
RUN npm ci --omit=dev

FROM node:18-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=prod-deps /app/node_modules ./node_modules
COPY app/src ./src
COPY app/routes ./routes
COPY app/package.json ./

EXPOSE 3000
USER node

CMD ["node", "src/server.js"]
