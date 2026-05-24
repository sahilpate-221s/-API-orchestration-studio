FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Install ALL dependencies including devDependencies for build
RUN npm ci

COPY . .

RUN npm run build

# Remove devDependencies after build
RUN npm prune --production

EXPOSE 5000

CMD ["node", "dist/index.js"]