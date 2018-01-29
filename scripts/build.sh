#!/bin/sh

cd docs && rm -rf * && cd ..
yarn run poi build
mv dist/* docs
cp src/404.html docs
# yarn run react-snap
echo 'exchange.projectwyvern.com' > docs/CNAME
rmdir dist
