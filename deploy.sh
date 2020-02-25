#!/bin/sh

set -e

tmpfile=$(mktemp)

cat conf.env > $tmpfile

git clean -f
git checkout .

git pull

cat $tmpfile > conf.env

docker-compose pull
docker-compose build
docker-compose up -d
