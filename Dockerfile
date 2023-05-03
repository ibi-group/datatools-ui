# We only need the dist and index.html from the build, the rest is extra weight to docker image
FROM node:14 AS build

ADD . /

RUN yarn install
RUN yarn run build -- --minify

FROM jitesoft/lighttpd:latest
RUN mkdir -p /var/www/html/dist
RUN mkdir -p /var/www/html/static
COPY --from=build /index.html /var/www/html/
COPY --from=build /static/ /var/www/html/static/
COPY --from=build /dist/ /var/www/html/dist/
