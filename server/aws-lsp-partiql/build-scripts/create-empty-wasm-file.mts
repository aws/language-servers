import { fs } from 'zx'

// Create empty .wasm binary file and move it to lib folder to have a file called `partiql_playground_bg.wasm` when webpack is checking import URLs
// during webpack build. Creating an empty file because we don't actually use the .wasm file but have the binary encoded into a string.
const noOpWasmContent =
    'Empty no-op file to have a file called `partiql_playground_bg.wasm` when doing import checks. This file is not used by the PartiQL LSP server, the WASM binary is used from a base64 string in the js bundle.'
fs.writeFileSync('out/partiql-parser-wasm/partiql_playground_bg.wasm', noOpWasmContent)
