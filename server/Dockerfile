FROM node:22-slim

# ✅ needed for prisma on slim image
RUN apt-get update -y && apt-get install -y openssl ca-certificates
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate 
EXPOSE 3000
CMD ["npm", "run", "dev"]