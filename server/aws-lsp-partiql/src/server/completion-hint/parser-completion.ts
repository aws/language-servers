import { CommonTokenStream, CharStream, ParseTree, TerminalNode } from 'antlr4ng'
import { PartiQLParser } from '../../antlr-generated/PartiQLParser'
import { PartiQLTokens } from '../../antlr-generated/PartiQLTokens'
import { CompletionList, CompletionItem } from '@aws/language-server-runtimes/server-interface'
import { CodeCompletionCore } from 'antlr4-c3'

const ignoredTokens = [
    PartiQLParser.CARET,
    PartiQLParser.COMMA,
    PartiQLParser.PLUS,
    PartiQLParser.MINUS,
    PartiQLParser.SLASH_FORWARD,
    PartiQLParser.PERCENT,
    PartiQLParser.AT_SIGN,
    PartiQLParser.TILDE,
    PartiQLParser.ASTERISK,
    PartiQLParser.VERTBAR,
    PartiQLParser.AMPERSAND,
    PartiQLParser.BANG,
    PartiQLParser.LT_EQ,
    PartiQLParser.GT_EQ,
    PartiQLParser.EQ,
    PartiQLParser.NEQ,
    PartiQLParser.CONCAT,
    PartiQLParser.ANGLE_LEFT,
    PartiQLParser.ANGLE_RIGHT,
    PartiQLParser.ANGLE_DOUBLE_LEFT,
    PartiQLParser.ANGLE_DOUBLE_RIGHT,
    PartiQLParser.BRACKET_LEFT,
    PartiQLParser.BRACKET_RIGHT,
    PartiQLParser.BRACE_LEFT,
    PartiQLParser.BRACE_RIGHT,
    PartiQLParser.PAREN_LEFT,
    PartiQLParser.PAREN_RIGHT,
    PartiQLParser.COLON,
    PartiQLParser.COLON_SEMI,
    PartiQLParser.QUESTION_MARK,
    PartiQLParser.PERIOD,
]

function initializePartiQLParser(content: string) {
    const inputStream = CharStream.fromString(content)
    const lexer = new PartiQLTokens(inputStream)
    const tokenStream = new CommonTokenStream(lexer)
    const parser = new PartiQLParser(tokenStream)
    // Override error listener as we only want completion behavior.
    parser.removeErrorListeners()
    return parser
}

function symbolAtCaretPosition(parseTree: TerminalNode, caretPosition: { line: number; character: number }) {
    const start = parseTree.symbol.column
    const stop = start + (parseTree.symbol.text?.length ?? 0)

    return (
        parseTree.symbol.line == caretPosition.line &&
        start <= caretPosition.character &&
        stop > caretPosition.character
    )
}

function computeTokenIndexOfTerminalNode(
    parseTree: TerminalNode,
    caretPosition: { line: number; character: number }
): number | undefined {
    if (symbolAtCaretPosition(parseTree, caretPosition)) {
        return parseTree.symbol.tokenIndex
    } else {
        return undefined
    }
}

function computeTokenIndexOfChildNode(
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

function computeTokenIndex(
    parseTree: ParseTree,
    caretPosition: { line: number; character: number }
): number | undefined {
    if (parseTree instanceof TerminalNode) {
        return computeTokenIndexOfTerminalNode(parseTree, caretPosition)
    } else {
        return computeTokenIndexOfChildNode(parseTree, caretPosition)
    }
}

function getTokenIndexFromParseTree(parser: PartiQLParser, position: { line: number; character: number }): number {
    const parseTree = parser.root()
    return computeTokenIndex(parseTree, position) ?? 0
}

function getCandidates(parser: PartiQLParser, index: number) {
    const core = new CodeCompletionCore(parser)
    // Ignore tokens
    core.ignoredTokens = new Set(ignoredTokens)

    // Add rules
    core.preferredRules = new Set([
        // No rules specified for now
    ])
    return core.collectCandidates(index)
}

// Get the position of the last space in the line before the given position
// Optimize completion on the middle of a word
function getPosition(
    content: string,
    position: { line: number; character: number }
): { line: number; character: number } {
    const lines = content.split('\n')
    const line = lines[position.line]
    const substring = line.substring(0, position.character)
    const lastSpaceIndex = substring.lastIndexOf(' ')
    return {
        line: position.line + 1, // change to 1-indexed line number
        character: lastSpaceIndex + 1,
    }
}

export function getSuggestions(content: string, position: { line: number; character: number }): CompletionList | null {
    position = getPosition(content, position)
    const parser = initializePartiQLParser(content)
    const tokenIndex = getTokenIndexFromParseTree(parser, position)
    const candidates = getCandidates(parser, tokenIndex)
    const items: CompletionItem[] = []
    candidates.tokens.forEach((_, token) => {
        let symbolicName = parser.vocabulary.getLiteralName(token)
        if (symbolicName) {
            symbolicName = symbolicName.replace(/["']/g, '')
            items.push({
                label: symbolicName.toUpperCase(),
            })
        }
    })

    return {
        isIncomplete: false,
        items,
    }
}
