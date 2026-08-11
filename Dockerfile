# Dockerfile
FROM node:22-alpine

WORKDIR /app

# Copy package configuration
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy everything else
COPY . .

# Build the frontend and compile the backend
RUN npm run build

# Expose the application port
EXPOSE 3000

# Start the Node.js server
CMD ["npm", "start"]
