# Stage 1: Build frontend
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production server
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# Install only production deps + tsx for running TypeScript server
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm install tsx

# Copy built frontend
COPY --from=build /app/dist ./dist

# Copy server source and data
COPY server ./server

EXPOSE 3141
CMD ["npx", "tsx", "server/index.ts"]
