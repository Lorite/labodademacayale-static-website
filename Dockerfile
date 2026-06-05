# --- La Boda de Macayale ---------------------------------------------------
# Lightweight Node image suitable for Coolify (Nixpacks or Dockerfile build).
FROM node:20-alpine

ENV NODE_ENV=production
WORKDIR /app

# Install only production dependencies first (better layer caching).
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Copy the application.
COPY . .

# Run as the built-in non-root user.
USER node

EXPOSE 3000

CMD ["node", "server.js"]
