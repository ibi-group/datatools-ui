# syntax=docker/dockerfile:1
FROM maven:3.8.7-openjdk-18

WORKDIR /datatools

ARG E2E_AUTH0_USERNAME
ARG E2E_AUTH0_PASSWORD
ARG E2E_S3_BUCKET
ARG MS_TEAMS_WEBHOOK_URL
ARG GITHUB_REF_SLUG
ARG GITHUB_SHA
ARG TRANSITFEEDS_KEY
ARG GITHUB_REPOSITORY
ARG GITHUB_WORKSPACE
ARG GITHUB_RUN_ID
ARG AUTH0_CLIENT_ID
ARG AUTH0_PUBLIC_KEY
ARG AUTH0_DOMAIN
ARG AUTH0_CONNECTION_NAME
ARG AUTH0_API_CLIENT
ARG AUTH0_API_SECRET
ARG OSM_VEX
ARG SPARKPOST_KEY
ARG SPARKPOST_EMAIL
ARG GTFS_DATABASE_URL
ARG GTFS_DATABASE_USER
ARG GTFS_DATABASE_PASSWORD
ARG MONGO_DB_NAME
ARG MONGO_HOST
ARG AWS_ACCESS_KEY_ID
ARG AWS_REGION
ARG AWS_SECRET_ACCESS_KEY

# Grab latest dev build of Datatools Server
RUN git clone https://github.com/ibi-group/datatools-server.git
RUN microdnf install wget
WORKDIR /datatools/datatools-server

RUN mvn package -DskipTests
RUN cp target/dt*.jar ./datatools-server-3.8.1-SNAPSHOT.jar

# Grab latest dev build of OTP
RUN wget https://repo1.maven.org/maven2/org/opentripplanner/otp/1.4.0/otp-1.4.0-shaded.jar
RUN mkdir -p /tmp/otp/graphs
RUN mkdir -p /var/datatools_gtfs

RUN mkdir ~/.aws && printf '%s\n' '[default]' 'aws_access_key_id=${AWS_ACCESS_KEY_ID}' 'aws_secret_access_key=${AWS_SECRET_ACCESS_KEY}' 'region=${AWS_REGION}' > ~/.aws/config

# Grab server config
RUN mkdir /config
RUN wget https://raw.githubusercontent.com/ibi-group/datatools-server/dev/configurations/default/server.yml.tmp -O /config/server.yml

# The enviornment variables contain everything needed on the server
COPY __tests__/e2e/server/datatools.pem /datatools/
RUN touch /config/env.yml
RUN env | sed 's/\=/\: /' > /config/env.yml

COPY __tests__/e2e/server/launch.sh launch.sh
RUN chmod +x launch.sh
CMD ./launch.sh
EXPOSE 8080
EXPOSE 4000
