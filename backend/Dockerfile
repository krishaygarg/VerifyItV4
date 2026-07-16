# Use Node 22 (required for native experimental SQLite node:sqlite support)
FROM node:22-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package config files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy server code
COPY server.js ./

# Copy database files (they will be copied into the working directory)
COPY verifyit.db ./verifyit.db
COPY verifyit_ai.db ./verifyit_ai.db

# Expose internal port
EXPOSE 3001

# Start server
CMD [ "node", "server.js" ]
