import Parser from 'web-tree-sitter'
import parserBase64 from '../tree-sitter-parser/tree-sitter-parser-inline'
import wasmBinaryArray from '../tree-sitter-parser/tree-sitter-inline'

// Initialize and prepare the parser
export async function initParser() {
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
