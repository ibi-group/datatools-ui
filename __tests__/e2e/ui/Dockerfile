# syntax=docker/dockerfile:1
FROM node:22
WORKDIR /datatools-build

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ARG BUGSNAG_KEY

RUN cd /datatools-build
COPY package.json yarn.lock patches /datatools-build/
RUN yarn
COPY . /datatools-build/
COPY configurations/default /datatools-config/

RUN env YAML_CONFIG=/datatools-build/configurations/default/env.yml yarn build
COPY . /datatools-build/
CMD yarn e2e-preview --port 9966 --host