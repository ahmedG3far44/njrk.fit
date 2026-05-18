FROM node:20-alpine

WORKDIR /server

COPY ./package*.json ./


RUN npm ci


COPY . .


RUN npm run build


EXPOSE 8081



CMD ["npm", "start"]
