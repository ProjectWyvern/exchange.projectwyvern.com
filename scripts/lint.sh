#!/bin/sh

set -e

eslint --ext js,vue src/**/*.vue --fix
