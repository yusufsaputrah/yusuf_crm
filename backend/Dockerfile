# ============================================================
# Smart CRM – Backend Dockerfile
# ============================================================
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies layer (cached separately from source)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source
COPY src/ ./src/

EXPOSE 5000

CMD ["node", "src/server.js"]
