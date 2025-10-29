FROM node:14
WORKDIR /datatools-build

ARG BUGSNAG_KEY

RUN cd /datatools-build
COPY package.json yarn.lock patches /datatools-build/
RUN yarn
COPY . /datatools-build/ 
COPY configurations/default /datatools-config/


# Copy the tmp file to the env.yml if no env.yml is present
RUN cp -R -u -p /datatools-config/env.yml.tmp /datatools-config/env.yml

CMD yarn run mastarm build --env dev --serve --proxy http://datatools-server:4000/api # 