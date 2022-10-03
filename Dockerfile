FROM node:18-alpine
WORKDIR /app

# install dependencies
RUN apk add python make gcc g++
COPY package*.json ./
RUN npm ci

# build source
COPY . ./
RUN npm run build

# start process
CMD ["npm", "run", "start"]
