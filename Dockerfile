# We only need the dist and index.html from the build, the rest is extra weight to docker image
FROM node:14 AS build

RUN apt-get update && \
    apt-get install -y --no-install-recommends gettext-base && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN yarn run build -- --minify

FROM jitesoft/lighttpd:latest
RUN mkdir -p /var/www/html/dist
COPY --from=builder /index.html /var/www/html
COPY --from=builder /dist/* /var/www/html/dist



