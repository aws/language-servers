import { SyntaxNode } from 'web-tree-sitter'
import { Hover, MarkupKind } from '@aws/language-server-runtimes/server-interface'
import { hoverDictionary } from './hoverDictionary'
import { globalParser, ensureParserInitialized } from '../tree-sitter-parser/parserUtil'

async function detectNodes(sourceCode: string, position: { line: number; character: number }): Promise<SyntaxNode> {
    await ensureParserInitialized()
    const tree = globalParser!.parse(sourceCode)
    const rootNode = tree.rootNode
    const node = rootNode.descendantForPosition({ row: position.line, column: position.character })
    return node
}

export async function type2Hover(
    sourceCode: string,
    position: { line: number; character: number },
    supportHoverMarkdown: boolean
): Promise<Hover | null> {
    const node = await detectNodes(sourceCode, position)
    const nodeType = node.type.toLowerCase() as keyof typeof hoverDictionary
    const nodeText = node.text.toLowerCase() as keyof (typeof hoverDictionary)[keyof typeof hoverDictionary]
    if (nodeType in hoverDictionary && nodeText in hoverDictionary[nodeType]) {
        const hoverInfo = hoverDictionary[nodeType][nodeText][supportHoverMarkdown ? 'markdown' : 'plaintext']
        return {
            contents: {
                kind: supportHoverMarkdown ? MarkupKind.Markdown : MarkupKind.PlainText,
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
