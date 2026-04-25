FROM node:20-alpine

WORKDIR /server

COPY server/package*.json ./


RUN npm ci


COPY server ./

RUN npm run build

EXPOSE 8080


CMD ["npm", "start"]