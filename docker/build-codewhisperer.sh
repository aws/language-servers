#!/bin/bash

# Build the Docker image without using cache
docker-compose build --no-cache

# Run a container to copy the built file
docker-compose run --rm language-servers-build cp /output/aws-lsp-codewhisperer.js /host-output/

echo "Build complete! The aws-lsp-codewhisperer.js file has been copied to the parent directory."
