FROM node:alpine
WORKDIR /usr/src/app

COPY . .
RUN npm install --production

EXPOSE 8080

CMD [ "npm", "run", "start" ]
