# AMON

This is the architecture of AMON NodeJS Test.

## Prerequisites

- Docker ([https://docs.docker.com/install](https://docs.docker.com/install))
- NodeJS =`12.0.0` (prefer install with [https://github.com/nvm-sh/nvm](https://github.com/nvm-sh/nvm))
- Postgres client (Osx: `brew install postgres`)

## Setup for development:

- Clone repository

```sh
git clone https://github.com/Mahmoud-Magdy-deeplearning/amon.git
```

- Use nvm to install node

```sh
nvm i 12.0.0
nvm use 12.0.0
```

- Install node dependencies

```sh
npm i
```

## Test

- Unit tests

```sh
npm run test
```

- Start/stop - restart dependencies

```sh
docker-compose down && docker-compose -f docker-compose.test.yml up --build db
```

## Run

- Run dependencies

```sh
npm run dependencies
```

- Create DB locally

```sh
npm run db:create
```

- Start api services

```sh
npm run service:api
```

## Stop

```sh
docker-compose down
```

## Environment

You can set environment variables in the `.env` file, you can find examples in .env.sample
