import partiQlServerBinary from '../partiql-parser-wasm/partiql-wasm-parser-inline'
import { initSync, parse_as_json } from '../partiql-parser-wasm/partiql_playground'
import { convertObjectToLexerError, createStringFromLexerError } from './error-parsing/lexer-errors'
import { convertObjectToParserError, createStringFromParserError } from './error-parsing/parser-errors'
import { normalizeQuery } from './language-service'

type parserTestDataType = { input: string; expectedOutput: string; errorType: string }

const parserTestData: parserTestDataType[] = [
    // Parser errors
    // SyntaxError - Couldn't find input to trigger these errors.
    { input: 'SELECT', expectedOutput: 'Unexpected end of input.', errorType: 'UnexpectedEndOfInput' },
    { input: 'SELECT FROM', expectedOutput: "Unexpected token 'FROM'.", errorType: 'UnexpectedToken' },
    // IllegalState - Couldn't find input to trigger these errors.

    // Lexer errors
    { input: '🥝', expectedOutput: 'Lexing error: invalid input: 🥝.', errorType: 'InvalidInput' },
    { input: '`', expectedOutput: 'Lexing error: unterminated ion literal.', errorType: 'UnterminatedIonLiteral' },
    { input: '/*', expectedOutput: 'Lexing error: unterminated comment.', errorType: 'UnterminatedComment' },
]

describe('PartiQL validation parsing', () => {
    // Instantiate the PartiQL parser.
    initSync(partiQlServerBinary)

    parserTestData.forEach(testData => {
        it(`should correctly parse errors for ${testData.errorType}.`, () => {
            const parsedQuery = JSON.parse(parse_as_json(normalizeQuery(testData.input)))
            const error = parsedQuery.errors[0]
            const diagnosticsMessage = convertObjectToParserError(error).message
            expect(diagnosticsMessage).toBe(testData.expectedOutput)
        })
    })

    it('should not give errors for quoted identifiers', () => {
        const parsedQuery = JSON.parse(parse_as_json(normalizeQuery('SELECT "test" from "yay"')))
        expect(parsedQuery.errors).toBeUndefined()
    })
})

type edgeCaseParserDataType = { input: any; name: string; specificErrorString: string }

// These inputs should all throw errors.
const edgeCaseParserTestData: edgeCaseParserDataType[] = [
    // SyntaxErrror
    {
        name: 'syntax error has no token',
        input: 'SyntaxError',
        specificErrorString: 'SyntaxError unexpected format',
    },
    {
        name: "syntax error doesn't have inner",
        input: { SyntaxError: { outer: 'yay', location: { start: 0, end: 0 } } },
        specificErrorString: 'SyntaxError unexpected format',
    },
    {
        name: 'syntax error inner not a string',
        input: { SyntaxError: { inner: () => {}, location: { start: 0, end: 0 } } },
        specificErrorString: 'SyntaxError unexpected format',
    },
    // UnexpectedToken
    {
        name: 'unexpected token error has no token',
        input: 'UnexpectedToken',
        specificErrorString: 'UnexpectedToken unexpected format',
    },
    {
        name: "unexpected token error doesn't have inner",
        input: { UnexpectedToken: { outer: 'yay', location: { start: 0, end: 0 } } },
        specificErrorString: 'UnexpectedToken unexpected format',
    },
    {
        name: 'unexpected token error inner not a string',
        input: { UnexpectedToken: { inner: () => {}, location: { start: 0, end: 0 } } },
        specificErrorString: 'UnexpectedToken unexpected format',
    },
    // LexicalError
    {
        name: 'lexical error is not an object or string',
        input: { LexicalError: { inner: () => {}, location: { start: 0, end: 0 } } },
        specificErrorString: 'LexicalError unexpected format',
    },
    {
        name: 'lexical error has no details',
        input: 'LexicalError',
        specificErrorString: 'LexicalError unexpected format',
    },
    {
        name: 'invalid input lexical error has no token',
        input: { LexicalError: { inner: 'InvalidInput', location: { start: 0, end: 0 } } },
        specificErrorString: 'InvalidInput unexpected format',
    },
    {
        name: "invalid input lexical error doesn't have inner",
        input: { LexicalError: { inner: { InvalidInput: { outer: 'yay' } }, location: { start: 0, end: 0 } } },
        specificErrorString: 'InvalidInput unexpected format',
    },
    {
        name: 'invalid input lexical error inner not a string',
        input: { LexicalError: { inner: { InvalidInput: { inner: () => {} } }, location: { start: 0, end: 0 } } },
        specificErrorString: 'InvalidInput unexpected format',
    },
    {
        name: 'lexical error has unexpected error type',
        input: { LexicalError: { inner: 'WeirdUnexpectedError', location: { start: 0, end: 0 } } },
        specificErrorString: 'unexpected lexer error type',
    },
    // IllegalState
    {
        name: 'illegal state error has details',
        input: { IllegalState: { inner: 'yay', location: { start: 0, end: 0 } } },
        specificErrorString: 'IllegalState unexpected format',
    },
    // Other
    {
        name: 'error is not an object or string',
        input: () => {},
        specificErrorString: 'parser error not object or string',
    },
    {
        name: 'given unexpected error type',
        input: 'WeirdUnexpectedError',
        specificErrorString: 'unexpected parser error type',
    },
    {
        name: 'given object with unexpected error type',
        input: { WeirdUnexpectedError: { inner: '' } },
        specificErrorString: 'unexpected parser error type',
    },
]

describe('error parsing edge-cases', () => {
    // These inputs should throw errors.
    edgeCaseParserTestData.forEach(testData => {
        it(`should throw when ${testData.name}.`, () => {
            expect(() => {
                convertObjectToParserError(testData.input)
            }).toThrowError(
                `Output from PartiQL parser does not have the expected format:  ${testData.specificErrorString}.`
            )
        })
    })

    it('should throw error when parser string builder is called with unknown error type', () => {
        expect(() => {
            createStringFromParserError('WeirdUnexpectedError')
        }).toThrowError('partiql error parsing error: unexpected parser error type')
    })
})

it('should pass error on transparently if not partiql parser format error', () => {
    expect(() => {
        convertObjectToParserError({
            SyntaxError: { inner: { token: 'cool token' }, noLocation: { noStart: 0, noEnd: 0 } },
        })
    }).toThrowError("Cannot read properties of undefined (reading 'start')")
})

// These inputs should all throw errors.
const edgeCaseLexerTestData: edgeCaseParserDataType[] = [
    {
        name: 'lexical error is not an object or string',
        input: () => {},
        specificErrorString: 'partiql error parsing error: lexer error not object or string',
    },
    {
        name: 'lexical error as object has unexpected type',
        input: { WeirdUnexpectedError: { inner: '' } },
        specificErrorString: 'partiql error parsing error: unexpected lexer error type',
    },
]

describe('lexer error parsing edge-cases', () => {
    // These inputs should throw errors. These tests are to handle specific cases which will normally be caught
    // by the parsing before it reaches the lexer error parsing.
    edgeCaseLexerTestData.forEach(testData => {
        it(`should throw when ${testData.name}.`, () => {
            expect(() => {
                convertObjectToLexerError(testData.input)
            }).toThrowError(`${testData.specificErrorString}`)
        })
    })

    it('should throw error when lexer string builder is called with unknown error type', () => {
        expect(() => {
            createStringFromLexerError('WeirdUnexpectedError')
        }).toThrowError('partiql error parsing error: unexpected lexer error type')
    })
})
