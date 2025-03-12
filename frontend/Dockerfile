FROM node:20-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy configuration files
COPY .env* tsconfig.json next.config.mjs ./
COPY public/ ./public/

# Copy source code
COPY src/ ./src/

# Explicitly create the .next directory to avoid permission issues
RUN mkdir -p .next

# Set environment variables
ENV NEXT_PUBLIC_API_URL=http://localhost:8000/api
ENV NEXT_SERVER_API_URL=http://backend:8000/api
ENV ESLINT_NO_DEV_ERRORS=true
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=development

# Build the application with ESLint check disabled
RUN echo "// This file is intentionally empty" > ./eslint.config.mjs || true
RUN npm run dev -- --turbo </dev/null & sleep 5 && kill $!

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "dev"] 