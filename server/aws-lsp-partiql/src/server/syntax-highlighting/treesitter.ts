import Parser from 'web-tree-sitter'
import parserBase64 from '../tree-sitter-parser/tree-sitter-parser-inline'

// Initialize and prepare the parser
async function initParser() {
    const Module = {
        locateFile: (pathURL: string, prefix: any) => {
            console.log('locateFile', pathURL)
            console.log('prefix', prefix)
            return prefix + pathURL
        },
    }
    await Parser.init(Module)
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
        console.log(`Found ${name}: '${node.text}' at position ${node.startPosition.row}:${node.startPosition.column}`)
    }
}

// Example usage
findNodes('SELECT * FROM my_table', 'keyword')
