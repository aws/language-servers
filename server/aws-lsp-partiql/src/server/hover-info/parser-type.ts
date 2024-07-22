import Parser, { SyntaxNode } from 'web-tree-sitter'
import { initParser } from '../tree-sitter-parser/parserUtil'
import { Hover, MarkupKind } from '@aws/language-server-runtimes/server-interface'
import { hoverDictionary } from './hoverDictionary'

// Global or service-level variables
let parserInitialized = false
let globalParser: Parser | null = null

async function ensureParserInitialized() {
    if (!parserInitialized) {
        globalParser = await initParser()
        parserInitialized = true
    }
}

async function detectNodes(sourceCode: string, position: { line: number; character: number }): Promise<SyntaxNode> {
    await ensureParserInitialized()
    const tree = globalParser!.parse(sourceCode)
    const rootNode = tree.rootNode
    const node = rootNode.descendantForPosition({ row: position.line, column: position.character })
    return node
}

export async function type2Hover(
    sourceCode: string,
    position: { line: number; character: number }
): Promise<Hover | null> {
    const node = await detectNodes(sourceCode, position)
    const nodeType = node.type.toLowerCase() as keyof typeof hoverDictionary
    const nodeText = node.text.toLowerCase() as keyof (typeof hoverDictionary)[keyof typeof hoverDictionary]
    if (nodeType in hoverDictionary && nodeText in hoverDictionary[nodeType]) {
        const hoverInfo = hoverDictionary[nodeType][nodeText]
        return {
            contents: {
                kind: MarkupKind.Markdown,
                value: hoverInfo,
            },
            range: {
                start: { line: node.startPosition.row, character: node.startPosition.column },
                end: { line: node.endPosition.row, character: node.endPosition.column },
            },
        }
    }
    return null
}
