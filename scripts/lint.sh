#!/bin/sh

set -e

yarn run eslint --ext js,vue src/**/*.vue src/*.vue src/*.js --fix
