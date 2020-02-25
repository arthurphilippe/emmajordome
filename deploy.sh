#!/bin/sh

set -e
git clean -f
git pull
docker-compose pull
docker-compose build
docker-compose up -d
