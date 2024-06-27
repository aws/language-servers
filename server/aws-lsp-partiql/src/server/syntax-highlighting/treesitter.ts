import Parser from 'web-tree-sitter'
import parserBase64 from '../tree-sitter-parser/tree-sitter-parser-inline'
import wasmBinaryArray from '../tree-sitter-parser/tree-sitter-inline'
import { SemanticTokenTypes, SemanticTokens } from '@aws/language-server-runtimes/server-interface'
import { SemanticToken, semanticTokensLegend, string2TokenTypes } from './util'
import { SemanticTokensBuilder } from 'vscode-languageserver/node'

// Initialize and prepare the parser
async function initParser() {
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

export async function findNodes(
    sourceCode: string | Parser.Input,
    nodeType: SemanticTokenTypes | string
): Promise<SemanticToken[]> {
    const parser = await initParser()
    const tree = parser.parse(sourceCode)
    const nodeTypeString: string = nodeType
    const query = parser.getLanguage().query(`
        (${nodeTypeString}) @${nodeTypeString}
    `)

    const captures = query.captures(tree.rootNode)

    const data: SemanticToken[] = []

    for (const { node, name } of captures) {
        // console.log(
        //     `Found ${name}: '${node.text}' at line:${node.startPosition.row} startChar:${node.startPosition.column} length:${node.text.length} `
        // )
        const tokenType =
            nodeTypeString in string2TokenTypes ? string2TokenTypes[nodeTypeString] : (nodeType as SemanticTokenTypes)
        const startLine = node.startPosition.row
        const startCharacter = node.startPosition.column
        const endLine = node.endPosition.row
        const endCharacter = node.endPosition.column
        const token: SemanticToken = {
            range: {
                start: { line: startLine, character: startCharacter },
                end: { line: endLine, character: endCharacter },
            },
            tokenType: tokenType,
        }
        data.push(token)
    }
    return data
}

export function sortSemanticTokens(tokens: SemanticToken[]): SemanticToken[] {
    return tokens.sort((a, b) => {
        // Compare start line
        if (a.range.start.line !== b.range.start.line) {
            return a.range.start.line - b.range.start.line
        }
        // Compare start character
        if (a.range.start.character !== b.range.start.character) {
            return a.range.start.character - b.range.start.character
        }
        // Compare end line
        if (a.range.end.line !== b.range.end.line) {
            return a.range.end.line - b.range.end.line
        }
        // Compare end character
        if (a.range.end.character !== b.range.end.character) {
            return a.range.end.character - b.range.end.character
        }
        return 0
    })
}

export function encodeSemanticTokens(tokens: SemanticToken[]): Promise<SemanticTokens | null> {
    if (!tokens || tokens.length === 0) {
        return Promise.resolve(null)
    }
    const sortedTokens = sortSemanticTokens(tokens)
    const builder = new SemanticTokensBuilder()
    for (const token of sortedTokens) {
        builder.push(
            token.range.start.line,
            token.range.start.character,
            // Token length
            token.range.end.character - token.range.start.character,
            // Token Type Index
            semanticTokensLegend.tokenTypes.indexOf(token.tokenType),
            // Token Modifier: Currently not supported
            0
        )
    }
    return Promise.resolve(builder.build())
}
