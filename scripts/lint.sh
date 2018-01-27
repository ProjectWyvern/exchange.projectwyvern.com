#!/bin/sh

set -e

eslint --ext js,vue src/**/*.vue src/*.vue --fix
