FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

WORKDIR /app/.medusa/server
RUN npm ci --omit=dev

EXPOSE 9000
ENV NODE_ENV=production
CMD ["npm", "run", "start"]