FROM node:latest

WORKDIR /app

COPY . .

RUN npm i

CMD ["node", "server"]

EXPOSE 5000
