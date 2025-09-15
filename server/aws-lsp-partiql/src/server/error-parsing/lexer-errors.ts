export type InvalidInputErrorInfo = string

const expectedLexerErrorTypes = ['InvalidInput', 'UnterminatedIonLiteral', 'UnterminatedComment', 'Unknown']

// The parser can return lexer errors as part of it's output. Lexer errors can be an object or a string
// in the same way as for the parser errors.
export function convertObjectToLexerError(error: any) {
    if (typeof error === 'object') {
        const [lexErrorType, lexErrorInfo] = Object.entries(error)[0] as [string, InvalidInputErrorInfo]
        if (!expectedLexerErrorTypes.includes(lexErrorType))
            throw new Error('partiql error parsing error: unexpected lexer error type')
        return createStringFromLexerError(lexErrorType, lexErrorInfo)
    } else if (typeof error === 'string') {
        if (!expectedLexerErrorTypes.includes(error))
            throw new Error('partiql error parsing error: unexpected lexer error type')
        return createStringFromLexerError(error)
    } else {
        throw new Error('partiql error parsing error: lexer error not object or string')
    }
}

// Convert the errors reported by the lexer to a human-readable string following
// the errors found in https://github.com/partiql/partiql-lang-rust/blob/5dc7c6e33666978654d3e4ed519209c2f8fc3038/partiql-parser/src/error.rs.
export function createStringFromLexerError(errorType: string, errorInfo?: InvalidInputErrorInfo) {
    switch (errorType) {
        case 'InvalidInput':
            if (!isInvalidInputErrorInfo(errorInfo))
                throw Error('partiql error parsing error: InvalidInput unexpected format')
            return `Lexing error: invalid input: ${errorInfo}.`

        case 'UnterminatedIonLiteral':
            return 'Lexing error: unterminated ion literal.'

        case 'UnterminatedComment':
            return 'Lexing error: unterminated comment.'

        case 'Unknown':
            return 'Lexing error: unknown error.'

        default:
            // This code path is only reached when error type doesn't match any of the expected error types which
            // should never happen when triggered by the error parsing process.
            throw new Error('partiql error parsing error: unexpected lexer error type')
    }
}

function isInvalidInputErrorInfo(errorInfo: InvalidInputErrorInfo | undefined): errorInfo is InvalidInputErrorInfo {
    const invalidInputErrorInfo = errorInfo as InvalidInputErrorInfo
    return !!invalidInputErrorInfo && typeof invalidInputErrorInfo === 'string'
}
