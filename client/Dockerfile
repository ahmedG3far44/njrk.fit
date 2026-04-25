# Build React app
FROM node:20-alpine AS builder

WORKDIR /client

COPY client/package*.json ./

RUN npm ci

COPY client ./

ENV VITE_API_URL=/api

RUN npm run build



# Stage 2: Serve with NGINX
FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder client/dist /usr/share/nginx/html

COPY client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

