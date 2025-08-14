#!/bin/bash

# This script collects all of the files needed for bundling and packages them
# into clients.zip and one servers.zip file per platform.
# Bundled outputs are placed in
# - build/archives/agent-standalone/(platform)-(architecture)
# - build/archives/shared

set -euxo pipefail

configs=("agent-standalone")

# Move chat client bundle to bundle folder
START_DIR=$(pwd)
CHAT_CLIENT_BUNDLE_DIR=$(pwd)/../../node_modules/@aws/chat-client/build
TARGET_BUILD_DIR=./build/private/bundle/client

mkdir -p $TARGET_BUILD_DIR
cp -r $CHAT_CLIENT_BUNDLE_DIR/* $TARGET_BUILD_DIR

# ZIP client files
ARCHIVES_DIR=./build/archives
mkdir -p $ARCHIVES_DIR/shared
zip -j $ARCHIVES_DIR/shared/clients.zip $TARGET_BUILD_DIR/*

# Create tempdir for unzipped qcontext files
TEMP_DIR=$(mktemp -d)
trap 'rm -rf -- "$TEMP_DIR"' EXIT

# Unzip each platform-specific file into its own subdirectory
# Windows x64
mkdir -p $TEMP_DIR/win-x64
unzip -o ./_bundle-assets/qserver-win32-x64.zip -d $TEMP_DIR/win-x64
mv $TEMP_DIR/win-x64/qserver $TEMP_DIR/win-x64/indexing
unzip -o ./_bundle-assets/ripgrep-win32-x64.zip -d $TEMP_DIR/win-x64

# Linux x64
mkdir -p $TEMP_DIR/linux-x64
unzip -o ./_bundle-assets/qserver-linux-x64.zip -d $TEMP_DIR/linux-x64
mv $TEMP_DIR/linux-x64/qserver $TEMP_DIR/linux-x64/indexing
unzip -o ./_bundle-assets/ripgrep-linux-x64.zip -d $TEMP_DIR/linux-x64

# Mac x64
mkdir -p $TEMP_DIR/mac-x64
unzip -o ./_bundle-assets/qserver-darwin-x64.zip -d $TEMP_DIR/mac-x64
mv $TEMP_DIR/mac-x64/qserver $TEMP_DIR/mac-x64/indexing
unzip -o ./_bundle-assets/ripgrep-darwin-x64.zip -d $TEMP_DIR/mac-x64

# Linux ARM64
mkdir -p $TEMP_DIR/linux-arm64
unzip -o ./_bundle-assets/qserver-linux-arm64.zip -d $TEMP_DIR/linux-arm64
mv $TEMP_DIR/linux-arm64/qserver $TEMP_DIR/linux-arm64/indexing
unzip -o ./_bundle-assets/ripgrep-linux-arm64.zip -d $TEMP_DIR/linux-arm64

# Mac ARM64
mkdir -p $TEMP_DIR/mac-arm64
unzip -o ./_bundle-assets/qserver-darwin-arm64.zip -d $TEMP_DIR/mac-arm64
mv $TEMP_DIR/mac-arm64/qserver $TEMP_DIR/mac-arm64/indexing
unzip -o ./_bundle-assets/ripgrep-darwin-arm64.zip -d $TEMP_DIR/mac-arm64

# ZIP server files
for config in "${configs[@]}"; do
    mkdir -p $ARCHIVES_DIR/${config}/linux-x64
    mkdir -p $ARCHIVES_DIR/${config}/mac-x64
    mkdir -p $ARCHIVES_DIR/${config}/linux-arm64
    mkdir -p $ARCHIVES_DIR/${config}/mac-arm64
    mkdir -p $ARCHIVES_DIR/${config}/win-x64

    # Win x64
    zip -j $ARCHIVES_DIR/${config}/win-x64/servers.zip \
        ./build/private/assets/win-x64/*
    if [ "$config" = "agent-standalone" ]; then
        (cd $TEMP_DIR/win-x64 && zip -r $OLDPWD/$ARCHIVES_DIR/${config}/win-x64/servers.zip indexing ripgrep/rg.exe)
    fi

    # Linux x64
    zip -j $ARCHIVES_DIR/${config}/linux-x64/servers.zip \
        ./build/private/assets/linux-x64/*
    if [ "$config" = "agent-standalone" ]; then
        (cd $TEMP_DIR/linux-x64 && zip -r $OLDPWD/$ARCHIVES_DIR/${config}/linux-x64/servers.zip indexing ripgrep/rg)
    fi

    # Mac x64
    zip -j $ARCHIVES_DIR/${config}/mac-x64/servers.zip \
        ./build/private/assets/mac-x64/*
    if [ "$config" = "agent-standalone" ]; then
        (cd $TEMP_DIR/mac-x64 && zip -r $OLDPWD/$ARCHIVES_DIR/${config}/mac-x64/servers.zip indexing ripgrep/rg)
    fi

    # Linux ARM64
    zip -j $ARCHIVES_DIR/${config}/linux-arm64/servers.zip \
        ./build/private/assets/linux-arm64/*
    if [ "$config" = "agent-standalone" ]; then
        (cd $TEMP_DIR/linux-arm64 && zip -r $OLDPWD/$ARCHIVES_DIR/${config}/linux-arm64/servers.zip indexing ripgrep/rg)
    fi

    # Mac ARM64
    zip -j $ARCHIVES_DIR/${config}/mac-arm64/servers.zip \
        ./build/private/assets/mac-arm64/*
    if [ "$config" = "agent-standalone" ]; then
        (cd $TEMP_DIR/mac-arm64 && zip -r $OLDPWD/$ARCHIVES_DIR/${config}/mac-arm64/servers.zip indexing ripgrep/rg)
    fi
done

cd ./build/private/bundle
for config in "${configs[@]}"; do
    cd ${config}
    zip -r ../../../../$ARCHIVES_DIR/${config}/win-x64/servers.zip .
    zip -r ../../../../$ARCHIVES_DIR/${config}/linux-x64/servers.zip .
    zip -r ../../../../$ARCHIVES_DIR/${config}/mac-x64/servers.zip .
    zip -r ../../../../$ARCHIVES_DIR/${config}/linux-arm64/servers.zip .
    zip -r ../../../../$ARCHIVES_DIR/${config}/mac-arm64/servers.zip .

    cd ..
done

cd $START_DIR

for config in "${configs[@]}"; do
    echo "Artifact Bundle Available in: $START_DIR/build/archives/${config}"
done
