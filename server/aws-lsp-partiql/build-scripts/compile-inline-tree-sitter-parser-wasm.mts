import { readFileSync, writeFileSync } from 'fs'

// Read .wasm binary file and add description of our modifications.
const base64EncodedBinary = readFileSync('./src/tree-sitter-wasm/tree-sitter-partiql.wasm', 'base64')
const modifications =
    '`base64EncodedBinary` contains a base64 encoding of the tree-sitter-partiql parser compiled to WebAssembly.\n\tModifications around it are to import it from a JS/TS file and instantiate it using `WebAssembly.instantiate.`'

// Copy the encoded binary into a .ts file.
const encodedPartiQLServer = `/*\n${modifications}\n*/\n\nconst base64String = atob("${base64EncodedBinary}");\nconst base64Buffer = new Uint8Array(base64String.length);\nfor (var i = 0; i < base64String.length; i++) base64Buffer[i] = base64String.charCodeAt(i);\nexport default base64Buffer;`
writeFileSync('./src/tree-sitter-wasm/tree-sitter-parser-inline.ts', encodedPartiQLServer)
