#!/bin/sh

set -e

tmpfile=$(mktemp)

cat conf.env > $tmpfile

git clean -f
git checkout .

cat $tmpfile > conf.env

git pull
docker-compose pull
docker-compose build
docker-compose up -d
