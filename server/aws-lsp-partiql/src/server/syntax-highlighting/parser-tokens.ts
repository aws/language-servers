import {
    SemanticTokenTypes,
    SemanticTokens,
    SemanticTokenModifiers,
    Range,
} from '@aws/language-server-runtimes/server-interface'
import { SemanticTokensBuilder } from 'vscode-languageserver/node'
import { semanticTokensLegend } from '../language-service'
import { globalParser, ensureParserInitialized } from '../tree-sitter-parser/parserUtil'

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

export async function findNodes(sourceCode: string, nodeType: SemanticTokenTypes | string): Promise<SemanticToken[]> {
    await ensureParserInitialized()
    const tree = globalParser!.parse(sourceCode)
    const nodeTypeString: string = nodeType
    const query = globalParser!.getLanguage().query(`
        (${nodeTypeString}) @${nodeTypeString}
    `)

    const captures = query.captures(tree.rootNode)

    const data: SemanticToken[] = []

    for (const { node, name } of captures) {
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

export function encodeSemanticTokens(tokens: SemanticToken[], multilineTokenSupport: boolean): SemanticTokens | null {
    if (!tokens || tokens.length === 0) {
        return null
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
    return builder.build()
}
