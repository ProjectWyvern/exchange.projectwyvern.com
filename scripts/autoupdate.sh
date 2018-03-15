#!/bin/sh

yarn add wyvern-schemas
git add package.json yarn.lock
VERSION=$(cat package.json | python2 -c "import json, sys; print(json.loads(sys.stdin.read())['dependencies']['wyvern-schemas'][1:])")
git commit -m "Update wyvern-schemas to $VERSION"
yarn build
cd docs
git add .
git commit -m "Update wyvern-schemas to $VERSION"
git push
cd ..
git add docs
git commit -m "Update wyvern-schemas to $VERSION (gh-pages)"
git push
