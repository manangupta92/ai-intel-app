# Use slim image
FROM node:20-slim AS app

# Set working directory
WORKDIR /app

# Install dependencies needed for building
RUN apt-get update && apt-get install -y \
    libc6 \
    build-essential \
    python3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install node_modules
RUN npm install

# Copy rest of the app
COPY . .

# Build Next.js app
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
