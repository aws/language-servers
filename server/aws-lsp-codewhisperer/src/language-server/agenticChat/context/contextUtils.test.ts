import * as path from 'path'
import * as sinon from 'sinon'
import * as assert from 'assert'
import { expect } from 'chai'
import { getUserPromptsDirectory, getNewPromptFilePath, promptFileExtension } from './contextUtils'
import * as pathUtils from '@aws/lsp-core/out/util/path'
import { sanitizeFilename } from '@aws/lsp-core/out/util/text'

describe('contextUtils', () => {
    let getUserHomeDirStub: sinon.SinonStub

    beforeEach(() => {
        getUserHomeDirStub = sinon.stub(pathUtils, 'getUserHomeDir')

        // Default behavior
        getUserHomeDirStub.returns('/home/user')
    })

    afterEach(() => {
        sinon.restore()
    })

    describe('getUserPromptsDirectory', () => {
        it('should return the correct prompts directory path', () => {
            const result = getUserPromptsDirectory()
            assert.strictEqual(result, path.join('/home/user', '.aws', 'amazonq', 'prompts'))
        })
    })

    describe('getNewPromptFilePath', () => {
        it('should use default name when promptName is empty', () => {
            const result = getNewPromptFilePath('')
            assert.strictEqual(
                result,
                path.join('/home/user', '.aws', 'amazonq', 'prompts', `default${promptFileExtension}`)
            )
        })

        it('should use default name when promptName is undefined', () => {
            const result = getNewPromptFilePath(undefined as unknown as string)
            assert.strictEqual(
                result,
                path.join('/home/user', '.aws', 'amazonq', 'prompts', `default${promptFileExtension}`)
            )
        })

        it('should trim whitespace from promptName', () => {
            const result = getNewPromptFilePath('  test-prompt  ')
            const expectedSanitized = sanitizeFilename('test-prompt')
            assert.strictEqual(
                result,
                path.join('/home/user', '.aws', 'amazonq', 'prompts', `${expectedSanitized}${promptFileExtension}`)
            )
        })

        it('should truncate promptName if longer than 100 characters', () => {
            const longName = 'a'.repeat(150)
            const truncatedName = 'a'.repeat(100)

            const result = getNewPromptFilePath(longName)
            const expectedSanitized = sanitizeFilename(truncatedName)

            assert.strictEqual(
                result,
                path.join('/home/user', '.aws', 'amazonq', 'prompts', `${expectedSanitized}${promptFileExtension}`)
            )
        })

        it('should sanitize the filename using sanitizeFilename', () => {
            const unsafeName = 'unsafe/name?with:invalid*chars'
            const expectedSanitized = sanitizeFilename(path.basename(unsafeName))

            const result = getNewPromptFilePath(unsafeName)

            assert.strictEqual(
                result,
                path.join('/home/user', '.aws', 'amazonq', 'prompts', `${expectedSanitized}${promptFileExtension}`)
            )
        })

        it('should handle path traversal attempts', () => {
            const traversalPath = '../../../etc/passwd'
            const expectedSanitized = sanitizeFilename(path.basename(traversalPath))

            const result = getNewPromptFilePath(traversalPath)

            assert.strictEqual(
                result,
                path.join('/home/user', '.aws', 'amazonq', 'prompts', `${expectedSanitized}${promptFileExtension}`)
            )
        })
    })
})
