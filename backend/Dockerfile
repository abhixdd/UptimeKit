FROM node:18-alpine

WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy app source
COPY . .

EXPOSE 3000
ENV NODE_ENV=production

CMD ["node", "server.js"]
