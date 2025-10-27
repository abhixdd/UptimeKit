FROM node:20-alpine
WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy app source
COPY . .

EXPOSE 3000
ENV NODE_ENV=production

CMD ["node", "server.js"]
