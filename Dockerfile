# Use official Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app’s source code
COPY . .

# Expose port 5174 for Vite
EXPOSE 5174

# Start Vite development server on port 5174
CMD ["npm", "run", "dev", "--", "--host"]