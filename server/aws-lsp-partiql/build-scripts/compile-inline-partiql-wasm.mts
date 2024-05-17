import { $ } from 'zx'

// Build/run docker container to build and encode binary.
await $`docker build build-scripts/compile-partiql-wasm-docker --file build-scripts/compile-partiql-wasm-docker/compile-base64-partiql-wasm-binary.dockerfile -t partiql-wasm`
await $`docker run --name partiql-wasm -d partiql-wasm:latest`

// Copy binary and bindings out of docker to host.
await $`docker cp partiql-wasm:/dir/partiql-rust-playground/pkg-web/. ./docker-output`

// Clean-up docker.
await $`docker stop partiql-wasm`
await $`docker rm partiql-wasm`

// Copy relevant files from docker-output folder to src folder.
const filesToMove = [
    'docker-output/partiql_playground.js',
    'docker-output/partiql_playground.d.ts',
    'docker-output/partiql-wasm-parser-inline.ts',
]
await $`mv ${filesToMove} src/partiql-parser-wasm`

// Clean-up generated files.
await $`rm -rf docker-output`
