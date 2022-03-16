FROM node:16.13.0 as builder

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY package.json package-lock.json /usr/src/app/

RUN npm i
#RUN npm audit fix

FROM node:16.13.0 as release
# RUN echo "deb http://deb.debian.org/debian jessie main\ndeb http://security.debian.org jessie/updates main" > /etc/apt/sources.list
RUN apt-get update && apt-get install netcat -y

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY --from=builder /usr/src/app/node_modules /usr/src/app/node_modules

COPY . /usr/src/app
