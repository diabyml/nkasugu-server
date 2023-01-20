FROM node:14

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package.json ./
COPY package-lock.json ./

RUN npm install

COPY . .
COPY .env.production .env

RUN npm build

ENV NODE_ENV production

EXPOSE 8080
CMD [ "node", "dist/src/index.js" ]
USER node