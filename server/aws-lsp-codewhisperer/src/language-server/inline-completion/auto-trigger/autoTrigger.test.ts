import assert = require('assert')
import { FileContext } from '../../../shared/codeWhispererService/codeWhispererServiceBase'
import { autoTrigger, getAutoTriggerType, triggerType } from './autoTrigger'

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
    describe('getAutoTriggerType', () => {
        const createContentChange = (text: string) => [{ text }]

        it('should return undefined for multi-line changes', () => {
            const changes = [{ text: 'line1\n' }, { text: 'line2' }]
            assert.strictEqual(getAutoTriggerType(changes), undefined)
        })

        it('should return undefined for empty changes', () => {
            assert.strictEqual(getAutoTriggerType(createContentChange('')), undefined)
        })

        it('should return "Enter" for newline changes', () => {
            assert.strictEqual(getAutoTriggerType(createContentChange('\n')), 'Enter')
            assert.strictEqual(getAutoTriggerType(createContentChange('\r\n')), 'Enter')
            assert.strictEqual(getAutoTriggerType(createContentChange('\n    ')), 'Enter')
            const changes = [{ text: '\n   ' }, { text: '' }]
            assert.strictEqual(getAutoTriggerType(changes), 'Enter')
        })

        it('should return undefined for tab changes', () => {
            assert.strictEqual(getAutoTriggerType(createContentChange('    ')), undefined)
            assert.strictEqual(getAutoTriggerType(createContentChange('        ')), undefined)
        })

        it('should return "SpecialCharacters" for special character changes', () => {
            assert.strictEqual(getAutoTriggerType(createContentChange('(')), 'SpecialCharacters')
            assert.strictEqual(getAutoTriggerType(createContentChange('()')), 'SpecialCharacters')
            assert.strictEqual(getAutoTriggerType(createContentChange('[')), 'SpecialCharacters')
            assert.strictEqual(getAutoTriggerType(createContentChange('[]')), 'SpecialCharacters')
            assert.strictEqual(getAutoTriggerType(createContentChange('{')), 'SpecialCharacters')
            assert.strictEqual(getAutoTriggerType(createContentChange('{}')), 'SpecialCharacters')
            assert.strictEqual(getAutoTriggerType(createContentChange(':')), 'SpecialCharacters')
        })

        it('should return "Classifier" for single character changes', () => {
            assert.strictEqual(getAutoTriggerType(createContentChange('a')), 'Classifier')
            assert.strictEqual(getAutoTriggerType(createContentChange('1')), 'Classifier')
            assert.strictEqual(getAutoTriggerType(createContentChange('.')), 'Classifier')
        })

        it('should return undefined for single line reformat', () => {
            assert.strictEqual(getAutoTriggerType(createContentChange('  ')), undefined)
            assert.strictEqual(getAutoTriggerType(createContentChange('   ')), undefined)
        })

        it('should return undefined for multi-character non-special changes', () => {
            assert.strictEqual(getAutoTriggerType(createContentChange('abc')), undefined)
            assert.strictEqual(getAutoTriggerType(createContentChange('123')), undefined)
        })

        it('should return undefined for multi-line input', () => {
            assert.strictEqual(getAutoTriggerType(createContentChange('line1\nline2')), undefined)
        })
    })
    describe('Right Context should trigger validation', () => {
        it('should not trigger when there is immediate right context in VSCode', () => {
            const params = createBasicParams({
                fileContext: createBasicFileContext('console.', 'log()'),
                ide: 'VSCODE',
            })

            const result = autoTrigger(params, console)
            assert.strictEqual(result.shouldTrigger, false)
        })

        it('should not trigger when right context starts with space', () => {
            const params = createBasicParams({
                fileContext: createBasicFileContext('console.', ' log()'),
            })

            const result = autoTrigger(params, console)
            assert.strictEqual(result.shouldTrigger, true)
        })

        it('should trigger when right context is just space', () => {
            const params = createBasicParams({
                fileContext: createBasicFileContext('console.', '  '),
            })

            const result = autoTrigger(params, console)
            assert.strictEqual(result.shouldTrigger, true)
        })
    })
})
