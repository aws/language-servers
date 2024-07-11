import Parser from 'web-tree-sitter'
import parserBase64 from '../tree-sitter-parser/tree-sitter-parser-inline'
import wasmBinaryArray from '../tree-sitter-parser/tree-sitter-inline'

// Initialize and prepare the parser
export async function initParser() {
    let wasmModuleUrl: string | null = null
    if (typeof window !== 'undefined' && typeof window.URL.createObjectURL === 'function') {
        // Browser
        const wasmBlob = new Blob([wasmBinaryArray], { type: 'application/wasm' })
        wasmModuleUrl = URL.createObjectURL(wasmBlob)
    } else if (typeof process !== 'undefined' && typeof process.versions.node !== 'undefined') {
        // Node.js
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const fs = require('fs')
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const path = require('path')
        const tempWasmPath = path.join(__dirname, 'temp-tree-sitter.wasm')
        fs.writeFileSync(tempWasmPath, Buffer.from(wasmBinaryArray))
        wasmModuleUrl = tempWasmPath
    }
    await Parser.init({
        locateFile(path: string, _prefix: string) {
            if (path.endsWith('.wasm')) {
                return wasmModuleUrl
            }
            return path
        },
    })
    const parser = new Parser()
    const PartiQL = await Parser.Language.load(parserBase64)
    parser.setLanguage(PartiQL)
    return parser
}
