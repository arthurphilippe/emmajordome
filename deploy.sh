#!/bin/sh

set -e
git checkout .
git pull
docker-compose pull
docker-compose build
docker-compose up -d
