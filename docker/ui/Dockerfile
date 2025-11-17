FROM node:22
WORKDIR /datatools-build

ARG BUGSNAG_KEY

RUN cd /datatools-build
COPY package.json yarn.lock patches /datatools-build/
RUN yarn
COPY . /datatools-build/
COPY configurations/default /datatools-config/


# Copy the tmp file to the env.yml if no env.yml is present
RUN cp -R -u -p /datatools-config/env.yml.tmp /datatools-config/env.yml

RUN env YAML_CONFIG=/datatools-build/configurations/default/env.yml yarn build
COPY . /datatools-build/
CMD yarn e2e-preview --port 9966 --host