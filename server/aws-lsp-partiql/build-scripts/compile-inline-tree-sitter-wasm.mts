import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'

// Using import.meta.resolve to dynamically resolve the path to the wasm file
const wasmModuleUrl = await import.meta.resolve('web-tree-sitter/tree-sitter.wasm')
const filePath = fileURLToPath(wasmModuleUrl)

// Read .wasm binary file and add description of our modifications.
const base64EncodedBinary = readFileSync(filePath, 'base64')
const modifications =
    '`base64EncodedBinary` contains a base64 encoding of the web-tree-sitter compiled to WebAssembly.\n\tModifications around it are to import it from a JS/TS file and instantiate it using `WebAssembly.instantiate.`'

// Copy the encoded binary into a .ts file.
const encodedPartiQLServer = `/*\n${modifications}\n*/\n\nconst base64String = atob("${base64EncodedBinary}");\nconst base64Buffer = new Uint8Array(base64String.length);\nfor (var i = 0; i < base64String.length; i++) base64Buffer[i] = base64String.charCodeAt(i);\nexport default base64Buffer;`
writeFileSync('./src/tree-sitter-wasm/tree-sitter-inline.ts', encodedPartiQLServer)
