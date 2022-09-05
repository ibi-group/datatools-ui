FROM node:18.8.0 AS node_modules
WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn

# fix issue: TypeError: text.replace is not a function
# RUN sed -i 's/text.replace/String(text).replace/' /app/node_modules/mastarm/lib/logger.js

FROM node:8.17.0 AS build

COPY --from=node_modules /app /app
WORKDIR /app

# downgrade to npm v5
RUN npm install -g npm@5.10.0

COPY . .

# CMD npm run build-prod
CMD yarn start
