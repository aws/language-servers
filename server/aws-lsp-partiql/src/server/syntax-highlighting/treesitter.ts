import Parser from 'web-tree-sitter'
import parserBase64 from '../tree-sitter-parser/tree-sitter-parser-inline'
import { SemanticTokens, SemanticTokenTypes, uinteger } from '@aws/language-server-runtimes/server-interface'
import { partiqltokensTypes } from '../language-service'

// Initialize and prepare the parser
async function initParser() {
    await Parser.init()
    const parser = new Parser()
    const PartiQL = await Parser.Language.load(parserBase64)
    parser.setLanguage(PartiQL)
    return parser
}

export function mapTokenType(name: string): uinteger {
    const index = partiqltokensTypes.indexOf(SemanticTokenTypes[name as keyof typeof SemanticTokenTypes])
    return index
}

export async function findNodes(
    sourceCode: string | Parser.Input,
    nodeType: SemanticTokenTypes
): Promise<SemanticTokens | null> {
    const parser = await initParser()
    const tree = parser.parse(sourceCode)
    const node: string = nodeType
    const query = parser.getLanguage().query(`
        (${node}) @${node}
    `)

    const captures = query.captures(tree.rootNode)

    const data: uinteger[] = []

    for (const { node, name } of captures) {
        // console.log(`Found ${name}: '${node.text}' at line:${node.startPosition.row} startChar:${node.startPosition.column} length:${node.text.length}`)
        const tokenType = mapTokenType(name)
        const tokenModifiers = 0 // No modifiers for now
        const line = node.startPosition.row
        const startChar = node.startPosition.column
        const length = node.text.length

        data.push(line, startChar, length, tokenType, tokenModifiers)
    }
    if (data.length === 0) {
        return null
    }

    return {
        data,
    }
}
// Example usage
// findNodes('SELECT * FROM my_table', 'keyword')
