#!/bin/sh

set -e
git clean
git pull
docker-compose pull
docker-compose build
docker-compose up -d
