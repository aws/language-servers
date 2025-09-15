import partiQlServerBinary from '../partiql-parser-wasm/partiql-wasm-parser-inline'
import { initSync, parse_as_json } from '../partiql-parser-wasm/partiql_playground'
import { convertObjectToLexerError, createStringFromLexerError } from './error-parsing/lexer-errors'
import { convertObjectToParserError, createStringFromParserError } from './error-parsing/parser-errors'
import { normalizeQuery, doAntlrValidation } from './language-service'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { SemanticToken, findNodes, encodeSemanticTokens } from './syntax-highlighting/parser-tokens'
import {
    SemanticTokenTypes,
    uinteger,
    Hover,
    MarkupKind,
    SignatureHelp,
    CompletionList,
} from '@aws/language-server-runtimes/server-interface'
import { type2Hover } from './hover-info/parser-type'
import { findSignatureInfo } from './signature-help/signature-info'
import { getSuggestions } from './completion-hint/parser-completion'

// Test error-parsing
type parserTestDataType = { input: string; expectedOutput: string; expectedAntlrOutput: string; errorType: string }

const parserTestData: parserTestDataType[] = [
    // Parser errors
    // SyntaxError - Couldn't find input to trigger these errors.
    {
        input: 'SELECT',
        expectedOutput: 'Unexpected end of input.',
        expectedAntlrOutput: 'Unexpected token: <EOF>',
        errorType: 'UnexpectedEndOfInput',
    },
    {
        input: 'SELECT FROM',
        expectedOutput: "Unexpected token 'FROM'.",
        expectedAntlrOutput: 'Unexpected token: FROM',
        errorType: 'UnexpectedToken',
    },
    // IllegalState - Couldn't find input to trigger these errors.

    // Lexer errors
    {
        input: '🥝',
        expectedOutput: 'Lexing error: invalid input: 🥝.',
        expectedAntlrOutput: 'Unexpected token: 🥝',
        errorType: 'InvalidInput',
    },
    {
        input: '`',
        expectedOutput: 'Lexing error: unterminated ion literal.',
        expectedAntlrOutput: 'Unexpected token: `',
        errorType: 'UnterminatedIonLiteral',
    },
    {
        input: '/*',
        expectedOutput: 'Lexing error: unterminated comment.',
        expectedAntlrOutput: 'Unexpected token: /',
        errorType: 'UnterminatedComment',
    },
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

describe('PartiQL validation parsing using ANTLR', () => {
    parserTestData.forEach(testData => {
        it(`should correctly parse errors for ${testData.errorType}.`, () => {
            const validationFile = TextDocument.create(
                'file:///testPartiQLvalidation.json',
                'partiql',
                1,
                testData.input
            )
            const diagnosticsMessage = doAntlrValidation(validationFile)[0].message
            expect(diagnosticsMessage).toBe(testData.expectedAntlrOutput)
        })
    })

    it('should not give errors for quoted identifiers', () => {
        const validationFile = TextDocument.create(
            'file:///testPartiQLvalidation.json',
            'partiql',
            1,
            'SELECT "test" from "yay"'
        )
        const diagnosticsMessages = doAntlrValidation(validationFile)
        expect(diagnosticsMessages).toHaveLength(0)
    })

    it('should not give errors for DML statements', () => {
        const validationFile = TextDocument.create(
            'file:///testPartiQLvalidation.json',
            'partiql',
            1,
            `UPDATE "Music" 
            SET AwardsWon=1 
            SET AwardDetail={'Grammys':[2020, 2018]}  
            WHERE Artist='Acme Band' AND SongTitle='PartiQL Rocks'`
        )
        const diagnosticsMessages = doAntlrValidation(validationFile)
        expect(diagnosticsMessages).toHaveLength(0)
    })

    it('should not give errors for DDL statements', () => {
        const validationFile = TextDocument.create(
            'file:///testPartiQLvalidation.json',
            'partiql',
            1,
            `CREATE TABLE VehicleRegistration`
        )
        const diagnosticsMessages = doAntlrValidation(validationFile)
        expect(diagnosticsMessages).toHaveLength(0)
    })

    it('should not give errors when adding PRIMARY KEY with one column', () => {
        const validationFile = TextDocument.create(
            'file:///testPartiQLvalidation.json',
            'partiql',
            1,
            `CREATE TABLE "test1"."test2" (
                "test_col1" ascii,
                PRIMARY KEY (test_col1)
            )`
        )
        const diagnosticsMessages = doAntlrValidation(validationFile)
        expect(diagnosticsMessages).toHaveLength(0)
    })

    it('should not give errors when adding PRIMARY KEY with multiple columns', () => {
        const validationFile = TextDocument.create(
            'file:///testPartiQLvalidation.json',
            'partiql',
            1,
            `CREATE TABLE "test1"."test2" (
                "test_col1" ascii,
                "test_col2" ascii,
                "test_col3" ascii,
                PRIMARY KEY ("test_col1", test_col2, "test_col3")
            )`
        )
        const diagnosticsMessages = doAntlrValidation(validationFile)
        expect(diagnosticsMessages).toHaveLength(0)
    })

    it('should not give errors when adding options to CREATE TABLE', () => {
        const validationFile = TextDocument.create(
            'file:///testPartiQLvalidation.json',
            'partiql',
            1,
            `CREATE TABLE "test1"."test2" (
                "test_col1" ascii,
                "test_col2" ascii,
                "test_col3" ascii
            ) WITH CUSTOM_PROPERTIES={
                'capacity_mode':{
                        'throughput_mode': 'PROVISIONED', 'read_capacity_units': 10, 'write_capacity_units': 20
                    },
                'point_in_time_recovery':{'status': 'enabled'},
                'encryption_specification':{
                        'encryption_type': 'CUSTOMER_MANAGED_KMS_KEY', 
                        'kms_key_identifier':'arn:aws:kms:eu-west-1:5555555555555:key/11111111-1111-111-1111-111111111111'
                    }
            }
            AND CLUSTERING ORDER BY ("test_col1" ASC, test_col2 DESC) 
            AND TAGS={'key1':'val1', 'key2':'val2'}
            AND default_time_to_live = 3024000;`
        )
        const diagnosticsMessages = doAntlrValidation(validationFile)
        expect(diagnosticsMessages).toHaveLength(0)
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

// Test Hover Help detection and info returns
type parserTestDataHoverHelp = {
    input: string
    position: { line: number; character: number }
    expectedOutput: Hover | null
}

// Tests Hover Help when markdown is supported
const parserTestDataHover: parserTestDataHoverHelp[] = [
    // Test hover help for keyword -> `SELECT`
    {
        input: `SELECT VALUE {v.a: v.b, v.c: v.d}
        FROM <<{'a':'same', 'b':1, 'c':'same'}>> AS v
        WHERE v.b`,
        position: { line: 0, character: 2 },
        expectedOutput: {
            contents: {
                kind: MarkupKind.Markdown,
                value: ['```typescript', '(keyword) SELECT: select data from a database', '```'].join('\n'),
            },
            range: {
                start: { line: 0, character: 0 },
                end: { line: 0, character: 6 },
            },
        },
    },
    // Test hover help for constant -> `NULL`
    {
        input: `SELECT NULL
        FROM <<{'a':'same', 'b':1, 'c':'same'}>> AS v
        WHERE v.b`,
        position: { line: 0, character: 9 },
        expectedOutput: {
            contents: {
                kind: MarkupKind.Markdown,
                value: [
                    '```typescript',
                    '(keyword) NULL: represents a null value for an existing attribute',
                    '```',
                ].join('\n'),
            },
            range: {
                start: { line: 0, character: 7 },
                end: { line: 0, character: 11 },
            },
        },
    },
    // Test for edge cases
    // Test hovering out of text range
    {
        input: `SELECT VALUE {v.a: v.b, v.c: v.d}
        FROM <<{'a':'same', 'b':1, 'c':'same'}>> AS v
        WHERE v.b`,
        position: { line: 3, character: 2 },
        expectedOutput: null,
    },
    // Test hover help at range edge
    {
        input: `SELECT VALUE {v.a: v.b, v.c: v.d}
        FROM <<{'a':'same', 'b':1, 'c':'same'}>> AS v
        WHERE v.b`,
        position: { line: 0, character: 0 },
        expectedOutput: {
            contents: {
                kind: MarkupKind.Markdown,
                value: ['```typescript', '(keyword) SELECT: select data from a database', '```'].join('\n'),
            },
            range: {
                start: { line: 0, character: 0 },
                end: { line: 0, character: 6 },
            },
        },
    },
    {
        input: `SELECT VALUE {v.a: v.b, v.c: v.d}
        FROM <<{'a':'same', 'b':1, 'c':'same'}>> AS v
        WHERE v.b`,
        position: { line: 0, character: 6 },
        expectedOutput: null,
    },
]

describe('PartiQL Hover Help testing', () => {
    parserTestDataHover.forEach(testData => {
        it(`should correctly detect token range and its hover info from dictionary.`, async () => {
            const hoverInfo = await type2Hover(testData.input, testData.position, true)
            expect(hoverInfo).toEqual(testData.expectedOutput)
        })
    })
})

// Tests Hover Help when markdown is not supported
const parserTestDataHoverText: parserTestDataHoverHelp[] = [
    // Test hover help for keyword -> `SELECT`
    {
        input: `SELECT VALUE {v.a: v.b, v.c: v.d}
        FROM <<{'a':'same', 'b':1, 'c':'same'}>> AS v
        WHERE v.b`,
        position: { line: 0, character: 2 },
        expectedOutput: {
            contents: {
                kind: MarkupKind.PlainText,
                value: '(keyword) SELECT: select data from a database',
            },
            range: {
                start: { line: 0, character: 0 },
                end: { line: 0, character: 6 },
            },
        },
    },
    // Test hover help for constant -> `NULL`
    {
        input: `SELECT NULL
        FROM <<{'a':'same', 'b':1, 'c':'same'}>> AS v
        WHERE v.b`,
        position: { line: 0, character: 9 },
        expectedOutput: {
            contents: {
                kind: MarkupKind.PlainText,
                value: '(keyword) NULL: represents a null value for an existing attribute',
            },
            range: {
                start: { line: 0, character: 7 },
                end: { line: 0, character: 11 },
            },
        },
    },
    // Test for edge cases
    // Test hover help at range edge
    {
        input: `SELECT VALUE {v.a: v.b, v.c: v.d}
        FROM <<{'a':'same', 'b':1, 'c':'same'}>> AS v
        WHERE v.b`,
        position: { line: 0, character: 0 },
        expectedOutput: {
            contents: {
                kind: MarkupKind.PlainText,
                value: '(keyword) SELECT: select data from a database',
            },
            range: {
                start: { line: 0, character: 0 },
                end: { line: 0, character: 6 },
            },
        },
    },
]

describe('PartiQL Hover Help testing', () => {
    parserTestDataHoverText.forEach(testData => {
        it(`should correctly detect token range and its hover info from dictionary.`, async () => {
            const hoverInfo = await type2Hover(testData.input, testData.position, false)
            expect(hoverInfo).toEqual(testData.expectedOutput)
        })
    })
})

// Test Function SignatureHelp detection and info returns
type parserTestDataSignatureHelp = {
    input: string
    expectedOutput: SignatureHelp | null
}

const parserTestDataSignature: parserTestDataSignatureHelp[] = [
    // Test signature help for built-in function -> `bit_length`
    // With no content following '('
    {
        input: 'SELECT BIT_LENGTH(',
        expectedOutput: {
            signatures: [
                {
                    label: 'BIT_LENGTH: String -> Int',
                    documentation: {
                        kind: MarkupKind.Markdown,
                        value: [
                            'Returns the number of bits in the input string.',
                            '#### Header',
                            '`BIT_LENGTH(str)`',
                            '#### Examples',
                            '```sql',
                            "bit_length('jose');      -- 32",
                            '```',
                        ].join('\n'),
                    },
                },
            ],
        },
    },
    // Test signature help for built-in function -> `bit_length`
    // With content following '('
    {
        input: 'SELECT BIT_LENGTH(test1, test2',
        expectedOutput: {
            signatures: [
                {
                    label: 'BIT_LENGTH: String -> Int',
                    documentation: {
                        kind: MarkupKind.Markdown,
                        value: [
                            'Returns the number of bits in the input string.',
                            '#### Header',
                            '`BIT_LENGTH(str)`',
                            '#### Examples',
                            '```sql',
                            "bit_length('jose');      -- 32",
                            '```',
                        ].join('\n'),
                    },
                },
            ],
        },
    },
    // Test signature help for built-in function -> `bit_length`
    // With dismiss notation ')'
    {
        input: 'SELECT BIT_LENGTH(test1, test2)',
        expectedOutput: null,
    },
]

describe('PartiQL SignatureHelp testing', () => {
    parserTestDataSignature.forEach(testData => {
        it(`should correctly detect the request for signatureHelp and return corresponding function signatureHelp from dictionary.`, async () => {
            const signatureHelp = findSignatureInfo(testData.input)
            expect(signatureHelp).toEqual(testData.expectedOutput)
        })
    })
})

// Test Completion Hint
type parserTestDataCompletionHint = {
    input: string
    position: { line: number; character: number }
    expectedOutput: CompletionList | null
}

const parserTestDataCompletion: parserTestDataCompletionHint[] = [
    // Test completion hint for incomplete variable `SEL` -> `SELECT`
    {
        input: `SEL`,
        position: { line: 0, character: 3 },
        expectedOutput: {
            isIncomplete: false,
            items: [
                {
                    label: 'SELECT',
                },
            ],
        },
    },
    // Test completion hint for `FROM CLAUSE`
    {
        input: `SELECT * `,
        position: { line: 0, character: 9 },
        expectedOutput: {
            isIncomplete: false,
            items: [
                {
                    label: 'FROM',
                },
            ],
        },
    },
    // Test completion hint for `AS` alais
    {
        input: `SELECT * FROM table_1 `,
        position: { line: 0, character: 22 },
        expectedOutput: {
            isIncomplete: false,
            items: [
                {
                    label: 'AS',
                },
            ],
        },
    },
    // Test completion hint for emply file -> `SELECT CLAUSE`
    {
        input: ``,
        position: { line: 0, character: 0 },
        expectedOutput: {
            isIncomplete: false,
            items: [
                {
                    label: 'SELECT',
                },
            ],
        },
    },
    // Test completion hint for Multi-lines file  -> `HAVING CLAUSE`
    {
        input: `SELECT attributeId, COUNT(*) as the_count
        FROM repeating_things
        GROUP BY attributeId 
        GROUP AS g `,
        position: { line: 3, character: 11 },
        expectedOutput: {
            isIncomplete: false,
            items: [
                {
                    label: 'HAVING',
                },
            ],
        },
    },
    // Test completion hint for a new query -> `SELECT CLAUSE`
    {
        input: `SELECT "a", b, c FROM stuff s INNER CROSS JOIN @s WHERE f(s)  -- comment
        
        `,
        position: { line: 1, character: 0 },
        expectedOutput: {
            isIncomplete: false,
            items: [
                {
                    label: 'SELECT',
                },
            ],
        },
    },
]

describe('PartiQL Completion Hint testing', () => {
    parserTestDataCompletion.forEach(testData => {
        it(`should correctly return completion hint list.`, async () => {
            const suggestions = getSuggestions(testData.input, testData.position)
            expect(suggestions!.items).toEqual(expect.arrayContaining([testData.expectedOutput!.items[0]]))
        })
    })
})
