FROM node:18.8.0 AS node_modules
WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn

FROM node:8.17.0 AS build

COPY --from=node_modules /app /app
WORKDIR /app

# downgrade to npm v5
RUN npm install -g npm@5.10.0

COPY . .

# CMD npm run build-prod
CMD yarn start
