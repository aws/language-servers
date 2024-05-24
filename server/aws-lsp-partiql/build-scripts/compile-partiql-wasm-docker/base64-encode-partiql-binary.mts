import { fs } from 'zx'

// Read .wasm binary file, NOTICE and LICENSE file and add description of our modifications.
const base64EncodedBinary = fs.readFileSync('/dir/partiql-rust-playground/pkg-web/partiql_playground_bg.wasm', 'base64')
const license = fs.readFileSync('/dir/partiql-rust-playground/pkg-web/LICENSE', 'utf-8')
const notice = fs.readFileSync('/dir/partiql-rust-playground/NOTICE', 'utf-8')
const modifications =
    '`base64EncodedBinary` contains a base64 encoding of the Rust PartiQL parser compiled to WebAssembly.\n\tModifications around it are to import it from a JS/TS file and instantiate it using `WebAssembly.instantiate.`'

// Copy the encoded binary, notice and license into a .ts file.
const encodedPartiQLServer = `/*\n${license}\n\n\t${notice}\n\n\t${modifications}\n*/\n\nconst base64String = atob(\"${base64EncodedBinary}\");\nconst base64Buffer = new Uint8Array(base64String.length);\nfor (var i = 0; i < base64String.length; i++) base64Buffer[i] = base64String.charCodeAt(i);\nexport default base64Buffer;`
fs.writeFileSync('/dir/partiql-rust-playground/pkg-web/partiql-wasm-parser-inline.ts', encodedPartiQLServer)
