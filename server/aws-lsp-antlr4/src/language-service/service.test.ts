import { TextDocument } from 'vscode-languageserver-textdocument'
import { CompletionList } from '@aws/language-server-runtimes/server-interface'
import { createANTLR4LanguageService } from './service'
import { type CharStream, type CommonTokenStream } from 'antlr4ng'
import { PartiQLParser } from '../test-utils/PartiQLParser'
import { PartiQLTokens } from '../test-utils/PartiQLTokens'

// This file tests the ANTLR language service by creating one based on PartiQL and testing parsing and completion based on that.

// Create ANTLR language service based on PartiQL lexer and parser
const service = createANTLR4LanguageService(
    ['sql'],
    (charStream: CharStream) => new PartiQLTokens(charStream),
    (tokenStream: CommonTokenStream) => new PartiQLParser(tokenStream),
    'root'
)

// Test error-parsing
type parserTestDataType = { input: string; expectedOutput: string; errorType: string }

const parserTestData: parserTestDataType[] = [
    // Parser errors
    {
        input: 'SELECT',
        expectedOutput: 'Unexpected token: <EOF>',
        errorType: 'UnexpectedEndOfInput',
    },
    {
        input: 'SELECT FROM',
        expectedOutput: 'Unexpected token: FROM',
        errorType: 'UnexpectedToken',
    },

    // Lexer errors
    {
        input: '🥝',
        expectedOutput: 'Unexpected token: 🥝',
        errorType: 'InvalidInput',
    },
    {
        input: '`',
        expectedOutput: 'Unexpected token: `',
        errorType: 'UnterminatedIonLiteral',
    },
    {
        input: '/*',
        expectedOutput: 'Unexpected token: /',
        errorType: 'UnterminatedComment',
    },
]

describe('PartiQL validation parsing using ANTLR', () => {
    parserTestData.forEach(testData => {
        it(`should correctly parse errors for ${testData.errorType}.`, async () => {
            const validationFile = TextDocument.create(
                'file:///testPartiQLvalidation.json',
                'partiql',
                1,
                testData.input
            )
            const diagnosticsMessage = (await service.doValidation(validationFile))[0].message
            expect(diagnosticsMessage).toBe(testData.expectedOutput)
        })
    })

    it('should not give errors for quoted identifiers', async () => {
        const validationFile = TextDocument.create(
            'file:///testPartiQLvalidation.json',
            'partiql',
            1,
            'SELECT "test" from "yay"'
        )
        const diagnosticsMessages = await service.doValidation(validationFile)
        expect(diagnosticsMessages).toHaveLength(0)
    })

    it('should not give errors for DML statements', async () => {
        const validationFile = TextDocument.create(
            'file:///testPartiQLvalidation.json',
            'partiql',
            1,
            `UPDATE "Music" 
            SET AwardsWon=1 
            SET AwardDetail={'Grammys':[2020, 2018]}  
            WHERE Artist='Acme Band' AND SongTitle='PartiQL Rocks'`
        )
        const diagnosticsMessages = await service.doValidation(validationFile)
        expect(diagnosticsMessages).toHaveLength(0)
    })

    it('should not give errors for DDL statements', async () => {
        const validationFile = TextDocument.create(
            'file:///testPartiQLvalidation.json',
            'partiql',
            1,
            `CREATE TABLE VehicleRegistration`
        )
        const diagnosticsMessages = await service.doValidation(validationFile)
        expect(diagnosticsMessages).toHaveLength(0)
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
            const suggestions = await service.doComplete(
                TextDocument.create('file:///testANTLRfile.partiql', 'partiql', 1, testData.input),
                testData.position
            )
            expect(suggestions!.items).toEqual(expect.arrayContaining([testData.expectedOutput!.items[0]]))
        })
    })
})
