import partiQlServerBinary from '../partiql-parser-wasm/partiql-wasm-parser-inline'
import { initSync, parse_as_json } from '../partiql-parser-wasm/partiql_playground'
import { convertObjectToLexerError, createStringFromLexerError } from './error-parsing/lexer-errors'
import { convertObjectToParserError, createStringFromParserError } from './error-parsing/parser-errors'
import { normalizeQuery } from './language-service'
import { SemanticToken, findNodes, encodeSemanticTokens } from './syntax-highlighting/parser-tokens'
import { SemanticTokenTypes, uinteger } from '@aws/language-server-runtimes/server-interface'

// Test error-parsing
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

// These tests contains one target tokenType in SemanticTokenTypes format
type parserTestDataTokenType = { input: string; expectedOutput: SemanticToken[]; tokenType: SemanticTokenTypes }

const parserTestDataToken: parserTestDataTokenType[] = [
    // Test data for multi-line comments
    {
        input: '/* multi\n  line\n  comment */',
        expectedOutput: [
            {
                range: {
                    start: { line: 0, character: 0 },
                    end: { line: 2, character: 12 },
                },
                tokenType: SemanticTokenTypes.comment,
                tokenLength: 28,
            },
        ],
        tokenType: SemanticTokenTypes.comment,
    },
    // Test data for keyword 'SELECT'
    {
        input: 'SELECT "a", b, c -- comment',
        expectedOutput: [
            {
                range: {
                    start: { line: 0, character: 0 },
                    end: { line: 0, character: 6 },
                },
                tokenType: SemanticTokenTypes.keyword,
                tokenLength: 6,
            },
        ],
        tokenType: SemanticTokenTypes.keyword,
    },
    // Test data for inline comment
    {
        input: 'SELECT "a", b, c -- comment',
        expectedOutput: [
            {
                range: {
                    start: { line: 0, character: 17 },
                    end: { line: 0, character: 27 },
                },
                tokenType: SemanticTokenTypes.comment,
                tokenLength: 10,
            },
        ],
        tokenType: SemanticTokenTypes.comment,
    },
    // Test data for punctuation
    {
        input: 'SELECT "a", b -- comment',
        expectedOutput: [
            {
                range: {
                    start: { line: 0, character: 10 },
                    end: { line: 0, character: 11 },
                },
                tokenType: SemanticTokenTypes.operator,
                tokenLength: 1,
            },
        ],
        tokenType: SemanticTokenTypes.operator,
    },
    // Test data for variable "a"
    {
        input: 'SELECT "a"  -- comment',
        expectedOutput: [
            {
                range: {
                    start: { line: 0, character: 7 },
                    end: { line: 0, character: 10 },
                },
                tokenType: SemanticTokenTypes.variable,
                tokenLength: 3,
            },
        ],
        tokenType: SemanticTokenTypes.variable,
    },
    // Test data for string 'co%'
    {
        input: `SELECT VALUE (PIVOT v AT g
                FROM UNPIVOT r as v At g
                WHERE g LIKE 'co%')
                FROM sensors AS r`,
        expectedOutput: [
            {
                range: {
                    start: { line: 2, character: 29 },
                    end: { line: 2, character: 34 },
                },
                tokenType: SemanticTokenTypes.string,
                tokenLength: 5,
            },
        ],
        tokenType: SemanticTokenTypes.string,
    },
    // Test data for number
    {
        input: `SELECT VALUE {v.a: v.b, v.c: v.d}
                FROM <<{'a':'same', 'b':1, 'c':'same'}>> AS v
                WHERE v.b`,
        expectedOutput: [
            {
                range: {
                    start: { line: 1, character: 40 },
                    end: { line: 1, character: 41 },
                },
                tokenType: SemanticTokenTypes.number,
                tokenLength: 1,
            },
        ],
        tokenType: SemanticTokenTypes.number,
    },
    // Test data for function
    {
        input: 'SELECT SUM(n) FROM <<numbers, numbers>> AS n',
        expectedOutput: [
            {
                range: {
                    start: { line: 0, character: 7 },
                    end: { line: 0, character: 10 },
                },
                tokenType: SemanticTokenTypes.function,
                tokenLength: 3,
            },
        ],
        tokenType: SemanticTokenTypes.function,
    },
]

// These tests contains one target tokenType in string format
type parserTestDataTokenStringType = { input: string; expectedOutput: SemanticToken[]; tokenType: string }

const parserTestDataTokenString: parserTestDataTokenStringType[] = [
    // Test data for ion
    {
        input: "SELECT x.* FROM `[{'a':1, 'b':1}, {'a':2}, \"foo\"]` AS x",
        expectedOutput: [
            {
                range: {
                    start: { line: 0, character: 16 },
                    end: { line: 0, character: 50 },
                },
                tokenType: SemanticTokenTypes.string,
                tokenLength: 34,
            },
        ],
        tokenType: 'ion',
    },
    // Test data for tuple_punc_separator
    {
        input: `SELECT VALUE {v.a: v.b, v.c: v.d}
                FROM verbose AS v
                WHERE v.b`,
        expectedOutput: [
            {
                range: {
                    start: { line: 0, character: 22 },
                    end: { line: 0, character: 23 },
                },
                tokenType: SemanticTokenTypes.operator,
                tokenLength: 1,
            },
        ],
        tokenType: 'tuple_punc_separator',
    },
    // Test data for tuple_punc_start
    {
        input: `SELECT VALUE {v.a: v.b, v.c: v.d}
                FROM verbose AS v
                WHERE v.b`,
        expectedOutput: [
            {
                range: {
                    start: { line: 0, character: 13 },
                    end: { line: 0, character: 14 },
                },
                tokenType: SemanticTokenTypes.operator,
                tokenLength: 1,
            },
        ],
        tokenType: 'tuple_punc_start',
    },
    // Test data for tuple_punc_end
    {
        input: `SELECT VALUE {v.a: v.b, v.c: v.d}
                FROM verbose AS v
                WHERE v.b`,
        expectedOutput: [
            {
                range: {
                    start: { line: 0, character: 32 },
                    end: { line: 0, character: 33 },
                },
                tokenType: SemanticTokenTypes.operator,
                tokenLength: 1,
            },
        ],
        tokenType: 'tuple_punc_end',
    },
    // Test data for pair_punc_separator
    {
        input: `SELECT VALUE {v.a: v.b}
                FROM verbose AS v
                WHERE v.b`,
        expectedOutput: [
            {
                range: {
                    start: { line: 0, character: 17 },
                    end: { line: 0, character: 18 },
                },
                tokenType: SemanticTokenTypes.operator,
                tokenLength: 1,
            },
        ],
        tokenType: 'pair_punc_separator',
    },
    // Test data for array_punc_start
    {
        input: `SELECT x.*
                FROM [{'a':1, 'b':1}, {'a':2}, 'foo'] AS x`,
        expectedOutput: [
            {
                range: {
                    start: { line: 1, character: 21 },
                    end: { line: 1, character: 22 },
                },
                tokenType: SemanticTokenTypes.operator,
                tokenLength: 1,
            },
        ],
        tokenType: 'array_punc_start',
    },
    // Test data for array_punc_end
    {
        input: `SELECT x.*
                FROM [{'a':1, 'b':1}, {'a':2}, 'foo'] AS x`,
        expectedOutput: [
            {
                range: {
                    start: { line: 1, character: 52 },
                    end: { line: 1, character: 53 },
                },
                tokenType: SemanticTokenTypes.operator,
                tokenLength: 1,
            },
        ],
        tokenType: 'array_punc_end',
    },
    // Test data for array_punc_separator
    {
        input: `SELECT x.*
                FROM [{'a':1, 'b':1}, {'a':2}] AS x`,
        expectedOutput: [
            {
                range: {
                    start: { line: 1, character: 36 },
                    end: { line: 1, character: 37 },
                },
                tokenType: SemanticTokenTypes.operator,
                tokenLength: 1,
            },
        ],
        tokenType: 'array_punc_separator',
    },
    // Test data for bag_punc_start
    {
        input: `SELECT VALUE {v.a: v.b, v.c: v.d}
                FROM <<'a', b>> AS v
                WHERE v.b`,
        expectedOutput: [
            {
                range: {
                    start: { line: 1, character: 21 },
                    end: { line: 1, character: 23 },
                },
                tokenType: SemanticTokenTypes.operator,
                tokenLength: 2,
            },
        ],
        tokenType: 'bag_punc_start',
    },
    // Test data for bag_punc_end
    {
        input: `SELECT VALUE {v.a: v.b, v.c: v.d}
                FROM <<'a', b>> AS v
                WHERE v.b`,
        expectedOutput: [
            {
                range: {
                    start: { line: 1, character: 29 },
                    end: { line: 1, character: 31 },
                },
                tokenType: SemanticTokenTypes.operator,
                tokenLength: 2,
            },
        ],
        tokenType: 'bag_punc_end',
    },
    // Test data for bag_punc_separator
    {
        input: `SELECT VALUE {v.a: v.b, v.c: v.d}
                FROM <<'a', b>> AS v
                WHERE v.b`,
        expectedOutput: [
            {
                range: {
                    start: { line: 1, character: 26 },
                    end: { line: 1, character: 27 },
                },
                tokenType: SemanticTokenTypes.operator,
                tokenLength: 1,
            },
        ],
        tokenType: 'bag_punc_separator',
    },
]

// These tests contains several target tokenType in SemanticTokenTypes format
type parserTestDataTokensType = { input: string; expectedOutput: uinteger[]; tokenType: SemanticTokenTypes }

const parserTestDataTokens: parserTestDataTokensType[] = [
    // Test the ordering of token with keywords type
    {
        input: `SELECT VALUE {v.a: v.b, v.c: v.d}
                FROM <<{'a':'same', 'b':1, 'c':'same'}>> AS v
                WHERE v.b`,
        expectedOutput: [0, 0, 6, 0, 0, 0, 7, 5, 0, 0, 1, 16, 4, 0, 0, 0, 41, 2, 0, 0, 1, 16, 5, 0, 0],
        tokenType: SemanticTokenTypes.keyword,
    },
]

describe('PartiQL Token Type parsing', () => {
    parserTestDataToken.forEach(testData => {
        it(`should correctly parse token type and its position for ${testData.tokenType}.`, async () => {
            // Mark this function as async
            const tokenList = await findNodes(testData.input, testData.tokenType)
            expect(tokenList).toEqual(testData.expectedOutput)
        })
    })

    parserTestDataTokenString.forEach(testData => {
        it(`should correctly parse token type and its position for ${testData.tokenType}.`, async () => {
            const tokenList = await findNodes(testData.input, testData.tokenType)
            expect(tokenList).toEqual(testData.expectedOutput)
        })
    })

    parserTestDataTokens.forEach(testData => {
        it(`should correctly parse, order, encode tokens with type ${testData.tokenType}.`, async () => {
            const tokenList = await findNodes(testData.input, testData.tokenType)
            const encodedTokens = await encodeSemanticTokens(tokenList, true)
            expect(encodedTokens?.data).toEqual(testData.expectedOutput)
        })
    })
})
