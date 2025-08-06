#!/bin/bash

# Downloads node distibutions and places them in 
# build/node-assets, which is picked up 
# by src/scripts/copy-node-assets.ts, to produce the final bundle.

set -e
NODE_VERSION="18"
BASE_URL="https://nodejs.org/download/release/latest-v${NODE_VERSION}.x"
SHASUMS_FILE="SHASUMS256.txt"
ASSETS_DIR="build/node-assets"

# Download SHASUMS256.txt
wget -q "$BASE_URL/$SHASUMS_FILE" -O "$SHASUMS_FILE"

# Extract exact Node.js version from any entry in SHASUMS256.txt
NODE_SEMVER=$(grep -o 'node-v[0-9]*\.[0-9]*\.[0-9]*' SHASUMS256.txt | head -1 | cut -d'v' -f2)

if [ -z "$NODE_SEMVER" ]; then
    echo "Failed to extract Node.js version from SHASUMS256.txt"
    exit 1
fi

echo "Found latest Node.js version: $NODE_SEMVER"

echo "Downloading assets for node version $NODE_SEMVER"

# Remove all files from ASSETS directory
rm -rf "$ASSETS_DIR" && mkdir "$ASSETS_DIR"

# Define expected files
EXPECTED_FILES=(
    "win-x64/node.exe"
    "node-v$NODE_SEMVER-linux-x64.tar.gz"
    "node-v$NODE_SEMVER-darwin-arm64.tar.gz"
    "node-v$NODE_SEMVER-linux-arm64.tar.gz"
    "node-v$NODE_SEMVER-darwin-x64.tar.gz"
)

# Process each expected file pattern
for actual_file in "${EXPECTED_FILES[@]}"; do
    # Search for the file in SHASUMS256.txt
    if grep -q "$actual_file" SHASUMS256.txt; then
        filepath="$ASSETS_DIR/$actual_file"
        expected_sum=$(grep "$actual_file" SHASUMS256.txt | awk '{print $1}')
        echo "Found $actual_file with shasum: $expected_sum"

        echo "Updating $actual_file"
        mkdir -p "$(dirname "$filepath")"
        wget -q "$BASE_URL/$actual_file" -O $filepath
    else
        echo "Warning: $actual_file not found in SHASUMS256.txt"
    fi
done

# Fetch and escape the license text
LICENSE_URL="https://raw.githubusercontent.com/nodejs/node/v${NODE_SEMVER}/LICENSE"
LICENSE_FILE="$ASSETS_DIR/LICENSE"

echo "Fetching Node.js license from $LICENSE_URL"
wget -q "$LICENSE_URL" -O "$LICENSE_FILE"

# Verify the license file was downloaded successfully
if [ ! -s "$LICENSE_FILE" ]; then
    echo "Downloaded license file is empty"
    rm -f "$LICENSE_FILE"
    exit 1
fi

echo "License file has been updated in $LICENSE_FILE"

# Read the escaped license text
LICENSE_TEXT=$(cat "$LICENSE_FILE")

# Update the attribution overrides file
ATTRIBUTION_FILE="../../attribution/overrides.json"

# Create attribution file with empty JSON object if it doesn't exist
if [ ! -f "$ATTRIBUTION_FILE" ]; then
    mkdir -p "$(dirname "$ATTRIBUTION_FILE")"
    echo "{}" > "$ATTRIBUTION_FILE"
fi

# Update version and licenseText fields using jq
# jq also escapes text by default
jq --indent 4 \
   --arg name "Node.js" \
   --arg version "$NODE_SEMVER" \
   --arg licenseText "$LICENSE_TEXT" \
   --arg url "https://github.com/nodejs/node" \
   --arg license "MIT" \
   '.node.name = $name | .node.version = $version | .node.url = $url | .node.license = $license | .node.licenseText = $licenseText' \
   "$ATTRIBUTION_FILE" > "$ATTRIBUTION_FILE.tmp" && mv "$ATTRIBUTION_FILE.tmp" "$ATTRIBUTION_FILE"
echo "Successfully updated Node.js version and license in $ATTRIBUTION_FILE"

# Cleanup
rm -f "$SHASUMS_FILE"