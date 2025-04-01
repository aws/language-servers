import assert = require('assert')
import { FileContext } from '../../../shared/codeWhispererService'
import { triggerType } from './autoTrigger'

describe('Auto Trigger', async () => {
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
})
