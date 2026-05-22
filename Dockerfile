# Dockerfile
# Use Node.js LTS image as base for building
FROM node:20-alpine AS builder

WORKDIR /app

# Shell variables for builds
ENV NODE_ENV=production

# Copy configuration files
COPY package*.json tsconfig.json vite.config.ts index.html ./

# Install all dependencies (including devDependencies to run build steps and tsx)
RUN npm ci

# Copy the rest of the workspace source code
COPY . .

# Compile the client-side frontend code
RUN npm run build

# Run-time stage with minimal image
FROM node:20-alpine

WORKDIR /app

# Copy built artifacts and fully resolved node dependencies from the builder stage
COPY --from=builder /app /app

# Ensure we run in production env
ENV NODE_ENV=production
ENV PORT=3000

# Expose port 3000 for server ingress mapping
EXPOSE 3000

# Start Express server via tsx
CMD ["npx", "tsx", "server.ts"]
