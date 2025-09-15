import { convertObjectToLexerError } from './lexer-errors'

type LocationInfo = {
    start: number
    end: number
}
type SyntaxErrorInfo = {
    inner: string
    location: LocationInfo
}
type UnexpectedTokenErrorInfo = {
    inner: { token: string }
    location: LocationInfo
}
type LexicalErrorInfo = {
    inner: object | string
    location: LocationInfo
}
type IllegalStateErrorInfo = {
    location: LocationInfo
}
type ParserErrorInfo = SyntaxErrorInfo | UnexpectedTokenErrorInfo | IllegalStateErrorInfo | LexicalErrorInfo

const expectedParserErrorTypes = [
    'SyntaxError',
    'UnexpectedEndOfInput',
    'UnexpectedToken',
    'LexicalError',
    'IllegalState',
    'Unknown',
]

export function convertObjectToParserError(error: any): { message: string; location: LocationInfo } {
    let errorType: string
    let errorInfo: ParserErrorInfo | undefined
    let location: LocationInfo

    // The error the parser returns should either be an object where the key is the error type and the
    // value for that key is the error details, or a string denothing the error type for the general file.
    // We place errors for the entire file at the first line/column of the doc. If something else we
    // throw an error.
    try {
        if (typeof error === 'object') {
            ;[errorType, errorInfo] = Object.entries(error)[0] as [string, ParserErrorInfo]
            // Check whether the error type is one of the correctly handled types.
            if (!expectedParserErrorTypes.includes(errorType))
                throw new Error('partiql error parsing error: unexpected parser error type')
            location = { start: errorInfo.location.start, end: errorInfo.location.end }
        } else if (typeof error === 'string') {
            // Check whether the error type is one of the correctly handled types.
            if (!expectedParserErrorTypes.includes(error))
                throw new Error('partiql error parsing error: unexpected parser error type')
            errorType = error
            location = { start: 0, end: 0 }
        } else {
            throw new Error('partiql error parsing error: parser error not object or string')
        }
        // If no error was thrown at this point, we know the error type matches our expectation,
        // try to construct the error string corresponding to the type from the info provided.
        return { message: createStringFromParserError(errorType, errorInfo), location: location }
    } catch (e) {
        if (e instanceof Error && e.message.startsWith('partiql error parsing error:')) {
            const specificError = e.message.split(':')[1]
            throw new Error(`Output from PartiQL parser does not have the expected format: ${specificError}.`)
        } else throw e
    }
}

// Convert the errors reported by the parser to a human-readable string following
// the errors found in https://github.com/partiql/partiql-lang-rust/blob/5dc7c6e33666978654d3e4ed519209c2f8fc3038/partiql-parser/src/error.rs.
export function createStringFromParserError(errorType: string, errorInfo?: ParserErrorInfo) {
    switch (errorType) {
        case 'SyntaxError':
            if (!isSyntaxErrorInfo(errorInfo))
                throw new Error('partiql error parsing error: SyntaxError unexpected format')
            return `Syntax Error: ${errorInfo.inner}.`

        case 'UnexpectedEndOfInput':
            return 'Unexpected end of input.'

        case 'UnexpectedToken':
            if (!isUnexptedTokenErrorInfo(errorInfo))
                throw new Error('partiql error parsing error: UnexpectedToken unexpected format')
            return `Unexpected token '${errorInfo.inner.token}'.`

        case 'LexicalError':
            if (!isLexicalErrorInfo(errorInfo))
                throw new Error('partiql error parsing error: LexicalError unexpected format')
            return convertObjectToLexerError(errorInfo.inner)

        case 'IllegalState':
            if (!isIllegalStateErrorInfo(errorInfo))
                throw new Error('partiql error parsing error: IllegalState unexpected format')
            return `Illegal State: ${errorInfo}.`

        case 'Unknown':
            'Unknown parse error.'

        default:
            // This code path is only reached when error type doesn't match any of the expected error types which
            // should never happen when triggered by the error parsing process.
            throw new Error('partiql error parsing error: unexpected parser error type')
    }
}

function isSyntaxErrorInfo(errorInfo: ParserErrorInfo | undefined): errorInfo is SyntaxErrorInfo {
    const syntaxErrorInfo = errorInfo as SyntaxErrorInfo
    return !!syntaxErrorInfo && syntaxErrorInfo.inner !== undefined && typeof syntaxErrorInfo.inner === 'string'
}
function isUnexptedTokenErrorInfo(errorInfo: ParserErrorInfo | undefined): errorInfo is UnexpectedTokenErrorInfo {
    const unexpectedTokenErrorInfo = errorInfo as UnexpectedTokenErrorInfo
    return (
        !!unexpectedTokenErrorInfo &&
        unexpectedTokenErrorInfo.inner !== undefined &&
        typeof unexpectedTokenErrorInfo.inner === 'object' &&
        unexpectedTokenErrorInfo.inner.token !== undefined &&
        typeof unexpectedTokenErrorInfo.inner.token === 'string'
    )
}
function isIllegalStateErrorInfo(errorInfo: ParserErrorInfo | undefined): errorInfo is IllegalStateErrorInfo {
    const illegalStateErrorInfo = errorInfo as IllegalStateErrorInfo
    return !!illegalStateErrorInfo && typeof illegalStateErrorInfo === 'string'
}
function isLexicalErrorInfo(errorInfo: ParserErrorInfo | undefined): errorInfo is LexicalErrorInfo {
    const lexicalErrorInfo = errorInfo as LexicalErrorInfo
    return (
        !!lexicalErrorInfo &&
        !!lexicalErrorInfo.inner &&
        (typeof lexicalErrorInfo.inner === 'string' || typeof lexicalErrorInfo.inner === 'object')
    )
}
