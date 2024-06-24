import Parser from 'web-tree-sitter'
import path = require('path')

// Initialize and prepare the parser
async function initParser() {
    await Parser.init()
    const parser = new Parser()
    const wasmPath = path.join(__dirname, 'tree-sitter-partiql.wasm')
    const PartiQL = await Parser.Language.load(wasmPath)
    parser.setLanguage(PartiQL)
    return parser
}

export async function findNodes(sourceCode: string | Parser.Input, node: string) {
    const parser = await initParser()
    const tree = parser.parse(sourceCode)
    const query = parser.getLanguage().query(`
        (${node}) @${node}
    `)

    const captures = query.captures(tree.rootNode)
    for (const { node, name } of captures) {
        console.log(`Found ${name}: '${node.text}' at position ${node.startPosition.row}:${node.startPosition.column}`)
    }
}

// Example usage
// findNodes('SELECT * FROM my_table', 'keyword')
