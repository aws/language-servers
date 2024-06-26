import Parser from 'web-tree-sitter'
import parserBase64 from '../tree-sitter-parser/tree-sitter-parser-inline'

// Initialize and prepare the parser
async function initParser() {
    await Parser.init()
    const parser = new Parser()
    const PartiQL = await Parser.Language.load(parserBase64)
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
        console.log(
            `Found ${name}: '${node.text}' at start position ${node.startPosition.row}:${node.startPosition.column} and end position ${node.endPosition.row}:${node.endPosition.column}`
        )
    }
}

// Example usage
// findNodes('SELECT * FROM my_table', 'keyword')
