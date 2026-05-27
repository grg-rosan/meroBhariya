FROM node:22-slim

RUN apt-get update -y && apt-get install -y openssl ca-certificates

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npx prisma generate

EXPOSE 3000

CMD sh -c "npx prisma migrate deploy && \
  until node prisma/seed.js; do echo 'Seed failed, retrying...'; sleep 3; done && \
  node src/server.js"