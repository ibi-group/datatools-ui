# syntax=docker/dockerfile:1
FROM public.ecr.aws/s2a5w2n9/puppeteer:latest
WORKDIR /datatools-ui

USER root
RUN apk add --no-cache git

RUN yarn global add https://github.com/ibi-group/otp-runner.git
RUN yarn global add miles-grant-ibigroup/mastarm#f61ca541a788e8cae8a0e32b886de754846ea16f

COPY package.json yarn.lock /datatools-ui/
RUN yarn
COPY . /datatools-ui/

RUN mkdir -p /opt/otp
RUN mkdir -p /datatools-ui/e2e-test-results/
RUN mkdir ~/.aws && printf '%s\n' '[default]' 'aws_access_key_id=${AWS_ACCESS_KEY_ID}' 'aws_secret_access_key=${AWS_SECRET_ACCESS_KEY}' 'region=${AWS_REGION}' > ~/.aws/config

RUN wget https://raw.githubusercontent.com/ettore26/wait-for-command/master/wait-for-command.sh
RUN chmod +x ./wait-for-command.sh

ENV TEST_FOLDER_PATH=/datatools-ui/e2e-test-results
ENV IS_DOCKER=true