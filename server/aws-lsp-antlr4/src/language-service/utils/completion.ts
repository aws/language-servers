import { ParseTree, TerminalNode, Parser } from 'antlr4ng'
import { CodeCompletionCore } from 'antlr4-c3'

// Get the symbol at the current cursor position
export function symbolAtCaretPosition(parseTree: TerminalNode, caretPosition: { line: number; character: number }) {
    const start = parseTree.symbol.column
    const stop = start + (parseTree.symbol.text?.length ?? 0)

    return (
        parseTree.symbol.line == caretPosition.line + 1 &&
        start <= caretPosition.character &&
        stop > caretPosition.character
    )
}

// Get the token index for a terminal node of the AST
export function computeTokenIndexOfTerminalNode(
    parseTree: TerminalNode,
    caretPosition: { line: number; character: number }
): number | undefined {
    if (symbolAtCaretPosition(parseTree, caretPosition)) {
        return parseTree.symbol.tokenIndex
    } else {
        return undefined
    }
}

// Recursively calculate the index of a child node of the AST
export function computeTokenIndexOfChildNode(
    parseTree: ParseTree,
    caretPosition: { line: number; character: number }
): number | undefined {
    for (let i = 0; i < parseTree.getChildCount(); i++) {
        const child = parseTree.getChild(i)
        if (child != null) {
            const index = computeTokenIndex(child, caretPosition)
            if (index !== undefined) {
                return index
            }
        }
    }
    return undefined
}

// Calcute the token index given the current cursor position
export function computeTokenIndex(
    parseTree: ParseTree,
    caretPosition: { line: number; character: number }
): number | undefined {
    if (parseTree instanceof TerminalNode) {
        return computeTokenIndexOfTerminalNode(parseTree, caretPosition)
    } else {
        return computeTokenIndexOfChildNode(parseTree, caretPosition)
    }
}

export function getTokenIndexFromParseTree(
    parser: Parser,
    parserRoot: string,
    position: { line: number; character: number }
): number {
    // @ts-ignore the root name depends on the Parser grammar, we assume what the integrators provides actually exists.
    const parseTree = parser[parserRoot]()
    return computeTokenIndex(parseTree, position) ?? 0
}

export function getCandidates(parser: Parser, index: number, ignoredTokens: Set<number>) {
    const core = new CodeCompletionCore(parser)
    // Ignore tokens
    core.ignoredTokens = ignoredTokens

    // Add rules
    core.preferredRules = new Set([
        // No rules specified for now
    ])
    return core.collectCandidates(index)
}

// Get the position of the last space in the line before the given position
// Optimize completion on the middle of a word
export function getPosition(
    content: string,
    position: { line: number; character: number }
): { line: number; character: number } {
    const lines = content.split('\n')
    const line = lines[position.line]
    const substring = line.substring(0, position.character)
    const lastSpaceIndex = substring.lastIndexOf(' ')
    return {
        line: position.line,
        character: lastSpaceIndex + 1,
    }
}
