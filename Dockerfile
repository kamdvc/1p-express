FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends docker.io docker-compose ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

ARG APP_MODE=tenant
ENV APP_MODE=${APP_MODE}
ENV PORT=3000

EXPOSE 3000

CMD ["node", "src/index.js"]
