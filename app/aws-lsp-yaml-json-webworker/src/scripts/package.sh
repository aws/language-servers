#!/bin/sh

set -euxo pipefail

export PKG_CACHE_PATH=./assets/

mkdir -p ./build/assets
cp -r ./assets/* ./build/assets/