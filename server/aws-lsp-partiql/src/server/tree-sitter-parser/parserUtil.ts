import Parser from 'web-tree-sitter'
import parserBase64 from '../../tree-sitter-wasm/tree-sitter-parser-inline'
import wasmBinaryArray from '../../tree-sitter-wasm/tree-sitter-inline'

// Global or service-level variables
let parserInitialized = false
export let globalParser: Parser | null = null

export async function ensureParserInitialized() {
    if (!parserInitialized) {
        globalParser = await initParser()
        parserInitialized = true
    }
}

// Initialize and prepare the parser
export async function initParser() {
    // Configure the loading path for the wasm file.
    // Read from the base64 encoded string instead of the default path.
    // This works for both webworker and Node.js environment.
    await Parser.init({
        instantiateWasm(imports: any, succesCallback: any) {
            WebAssembly.instantiate(wasmBinaryArray, imports).then(arg => succesCallback(arg.instance, arg.module))
        },
    })
    const parser = new Parser()
    const PartiQL = await Parser.Language.load(parserBase64)
    parser.setLanguage(PartiQL)
    return parser
}
