# Local dev environment

This section explains how to prepare a local dev environment and parameters

## Requirements

1. [Docker](https://docs.docker.com/get-docker/) shall be available to execute a local postgresql database
2. [Nodejs 14+](https://nodejs.org/en/download/) shall be installed also
3. [Docker-compose](https://docs.docker.com/compose/install/)

## Installing dependencies

```bash
npm i
```

## Launch full project with dockers

```bash
docker-compose up --build
```

## Clean all your docker-compose

```bash
docker-compose up --force-recreate --remove-orphans --build -d
```

## Sequelize CLI

Documentation: https://sequelize.org/master/manual/migrations.html

Tutorial: https://www.youtube.com/watch?v=a5Wh_LDXtLc

```bash
npm run db:migrate
```

## Quickstart Localhost Working Environment Setup

- Enter the root directory of the project.
- Copy `.env.local` to `.env`.
- Ensure your `.env` file is correctly populated
- Run `npm run start:local`
- To stop database and ALSO delete the volumes, run `docker-compose down -v`
