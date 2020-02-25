#!/bin/sh

set -e
git clean -f
git checkout .
git pull
docker-compose pull
docker-compose build
docker-compose up -d
