# Stage 1 — build React app
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ARG VITE_API_URL
ARG VITE_KHALTI_PUBLIC_KEY
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_KHALTI_PUBLIC_KEY=$VITE_KHALTI_PUBLIC_KEY

RUN npm run build

# Stage 2 — serve with nginx (lightweight)
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]