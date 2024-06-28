import Parser from 'web-tree-sitter'
import parserBase64 from '../tree-sitter-parser/tree-sitter-parser-inline'
import wasmBinaryArray from '../tree-sitter-parser/tree-sitter-inline'
import {
    SemanticTokenTypes,
    SemanticTokens,
    SemanticTokenModifiers,
    Range,
} from '@aws/language-server-runtimes/server-interface'
import { SemanticTokensBuilder } from 'vscode-languageserver/node'
import { semanticTokensLegend } from '../language-service'

export interface SemanticToken {
    range: Range
    tokenType: SemanticTokenTypes
    tokenLength: number
    /**
     * An optional array of modifiers for this token
     */
    tokenModifiers?: SemanticTokenModifiers[]
}

export const string2TokenTypes: { [key: string]: SemanticTokenTypes } = {
    tuple_punc_start: SemanticTokenTypes.operator,
    tuple_punc_end: SemanticTokenTypes.operator,
    tuple_punc_separator: SemanticTokenTypes.operator,
    pair_punc_separator: SemanticTokenTypes.operator,
    array_punc_start: SemanticTokenTypes.operator,
    array_punc_end: SemanticTokenTypes.operator,
    array_punc_separator: SemanticTokenTypes.operator,
    bag_punc_start: SemanticTokenTypes.operator,
    bag_punc_end: SemanticTokenTypes.operator,
    bag_punc_separator: SemanticTokenTypes.operator,
    ion: SemanticTokenTypes.string,
}

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
        console.log(
            `Found ${name}: '${node.text}' at line:${node.startPosition.row} startChar:${node.startPosition.column} length:${node.text.length} endLine:${node.endPosition.row} endChar:${node.endPosition.column}`
        )
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
            tokenLength: node.text.length,
        }
        data.push(token)
    }
    return data
}

function _sortSemanticTokens(tokens: SemanticToken[]): SemanticToken[] {
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

function _breakMultilineTokens(tokens: SemanticToken[]): SemanticToken[] {
    const breakDownTokens: SemanticToken[] = []
    for (const token of tokens) {
        const startLine = token.range.start.line
        const endLine = token.range.end.line
        const startCharacter = token.range.start.character
        const endCharacter = token.range.end.character
        const originalLength = token.tokenLength
        if (startLine === endLine) {
            breakDownTokens.push(token)
        } else {
            const FirstToken: SemanticToken = {
                range: {
                    start: { line: startLine, character: startCharacter },
                    end: { line: startLine, character: startCharacter + originalLength },
                },
                tokenType: token.tokenType,
                tokenLength: originalLength,
            }
            breakDownTokens.push(FirstToken)
            for (let i = startLine + 1; i < endLine; i++) {
                const innerToken: SemanticToken = {
                    range: {
                        start: { line: i, character: 0 },
                        end: { line: i, character: originalLength },
                    },
                    tokenType: token.tokenType,
                    tokenLength: originalLength,
                }
                breakDownTokens.push(innerToken)
            }
            const lastToken: SemanticToken = {
                range: {
                    start: { line: endLine, character: 0 },
                    end: { line: endLine, character: endCharacter },
                },
                tokenType: token.tokenType,
                tokenLength: endCharacter,
            }
            breakDownTokens.push(lastToken)
        }
    }
    return breakDownTokens
}

export function encodeSemanticTokens(
    tokens: SemanticToken[],
    multilineTokenSupport: boolean
): Promise<SemanticTokens | null> {
    if (!tokens || tokens.length === 0) {
        return Promise.resolve(null)
    }
    let sortedTokens = _sortSemanticTokens(tokens)
    if (multilineTokenSupport) {
        sortedTokens = _breakMultilineTokens(sortedTokens)
    }
    const builder = new SemanticTokensBuilder()
    for (const token of sortedTokens) {
        builder.push(
            token.range.start.line,
            token.range.start.character,
            // Token length
            token.tokenLength,
            // Token Type Index
            semanticTokensLegend.tokenTypes.indexOf(token.tokenType),
            // Token Modifier: Currently not supported
            0
        )
    }
    return Promise.resolve(builder.build())
}
