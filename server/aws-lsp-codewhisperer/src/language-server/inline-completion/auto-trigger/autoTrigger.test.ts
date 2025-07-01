import assert = require('assert')
import { FileContext } from '../../../shared/codeWhispererService'
import { autoTrigger, triggerType } from './autoTrigger'

describe('Auto Trigger', async () => {
    const createBasicFileContext = (left: string = '', right: string = ''): FileContext => ({
        filename: 'test.ts',
        leftFileContent: left,
        rightFileContent: right,
        programmingLanguage: {
            languageName: 'typescript',
        },
    })

    const createBasicParams = (overrides = {}) => ({
        fileContext: createBasicFileContext(),
        char: 'a',
        triggerType: 'Classifier',
        os: 'Windows',
        previousDecision: 'Accept',
        ide: 'VSCODE',
        lineNum: 1,
        ...overrides,
    })

    describe('Get Trigger Type', async () => {
        const HELLO_WORLD_IN_CSHARP = `class HelloWorld
{
    🐵static void Main(🐶)
    {
        Console.🦊WriteLine("Hello World!");
        🐱
    }
}
`

        it('returns SpecialCharacters trigger after brackets with newline', async () => {
            const context = HELLO_WORLD_IN_CSHARP.split('🐵')
            const fileContext: FileContext = {
                filename: 'test.cs',
                leftFileContent: context[0],
                rightFileContent: context[1],
                programmingLanguage: {
                    languageName: 'csharp',
                },
            }
            const trigger = triggerType(fileContext)
            assert.equal(trigger, 'SpecialCharacters')
        })

        it('returns SpecialCharacters trigger after parenthesis', async () => {
            const context = HELLO_WORLD_IN_CSHARP.split('🐶')
            const fileContext: FileContext = {
                filename: 'test.cs',
                leftFileContent: context[0],
                rightFileContent: context[1],
                programmingLanguage: {
                    languageName: 'csharp',
                },
            }
            const trigger = triggerType(fileContext)
            assert.equal(trigger, 'SpecialCharacters')
        })

        it('returns Classifier trigger after regular typing', async () => {
            const context = HELLO_WORLD_IN_CSHARP.split('🦊')
            const fileContext: FileContext = {
                filename: 'test.cs',
                leftFileContent: context[0],
                rightFileContent: context[1],
                programmingLanguage: {
                    languageName: 'csharp',
                },
            }
            const trigger = triggerType(fileContext)
            assert.equal(trigger, 'Classifier')
        })

        it('returns Enter trigger after newline with some indentation', async () => {
            const context = HELLO_WORLD_IN_CSHARP.split('🐱')
            const fileContext: FileContext = {
                filename: 'test.cs',
                leftFileContent: context[0],
                rightFileContent: context[1],
                programmingLanguage: {
                    languageName: 'csharp',
                },
            }
            const trigger = triggerType(fileContext)
            assert.equal(trigger, 'Enter')
        })

        it('returns Classifier trigger for empty file', async () => {
            const fileContext: FileContext = {
                filename: 'test.cs',
                leftFileContent: '',
                rightFileContent: '',
                programmingLanguage: {
                    languageName: 'csharp',
                },
            }
            const trigger = triggerType(fileContext)
            assert.equal(trigger, 'Classifier')
        })
    })

    describe('Right Context should trigger validation', () => {
        it('should not trigger when there is immediate right context in VSCode', () => {
            const params = createBasicParams({
                fileContext: createBasicFileContext('console.', 'log()'),
                ide: 'VSCODE',
            })

            const result = autoTrigger(params)
            assert.strictEqual(result.shouldTrigger, false)
        })

        it('should not trigger when right context starts with space', () => {
            const params = createBasicParams({
                fileContext: createBasicFileContext('console.', ' log()'),
            })

            const result = autoTrigger(params)
            assert.strictEqual(result.shouldTrigger, true)
        })

        it('should trigger when right context is just space', () => {
            const params = createBasicParams({
                fileContext: createBasicFileContext('console.', '  '),
            })

            const result = autoTrigger(params)
            assert.strictEqual(result.shouldTrigger, true)
        })
    })
})
