import { $, cd } from 'zx'

// Install Rust using Rustup and WASM dependencies.
await $`npm install -g wasm-pack`
await $`curl https://sh.rustup.rs -sSf | sh -s -- -y`

// Clone partiql rust playground and run build script.
await $`git clone https://github.com/partiql/partiql-rust-playground`
cd('partiql-rust-playground')
await $`make build`
