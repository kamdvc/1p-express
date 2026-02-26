FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

ARG APP_MODE=tenant
ENV APP_MODE=${APP_MODE}
ENV PORT=3000

EXPOSE 3000

CMD ["node", "src/index.js"]
