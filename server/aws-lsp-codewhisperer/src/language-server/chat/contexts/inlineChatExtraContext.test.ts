import { TestFeatures } from '@aws/language-server-runtimes/testing'
import { QChatTriggerContext } from './triggerContext'
import { ChatTriggerType } from '@amzn/codewhisperer-streaming'
import assert = require('assert')
import sinon = require('sinon')

describe('QChatTriggerContext - Inline Chat Extra Context', () => {
    let testFeatures: TestFeatures
    let amazonQServiceManager: any
    let triggerContext: QChatTriggerContext

    beforeEach(() => {
        testFeatures = new TestFeatures()
        amazonQServiceManager = {
            getConfiguration: sinon.stub(),
        }
        triggerContext = new QChatTriggerContext(testFeatures.workspace, testFeatures.logging, amazonQServiceManager)
    })

    afterEach(() => {
        sinon.restore()
    })

    it('should add extra context to document text for inline chat', async () => {
        const extraContextString = 'This is extra context for inline chat'
        const originalDocumentText = 'const x = 1;'
        const expectedDocumentText = extraContextString + '\n\n' + originalDocumentText
        const mockConfig = {
            inlineChat: {
                extraContext: extraContextString,
            },
        }

        amazonQServiceManager.getConfiguration.returns(mockConfig)

        const mockDocumentContext = {
            text: originalDocumentText,
            programmingLanguage: { languageName: 'typescript' },
            relativeFilePath: 'test.ts',
            cursorState: { position: { line: 0, character: 0 } },
            hasCodeSnippet: false,
            totalEditorCharacters: originalDocumentText.length,
        }

        sinon.stub(triggerContext, 'extractDocumentContext').resolves(mockDocumentContext)

        const params = {
            prompt: {
                prompt: 'Explain this code',
                escapedPrompt: 'Explain this code',
            },
            textDocument: {
                uri: 'file:///test.ts',
            },
            cursorState: [{ position: { line: 0, character: 0 } }],
        }

        const triggerContextResult = await triggerContext.getNewTriggerContext(params)
        const chatParams = triggerContext.getChatParamsFromTrigger(
            params,
            triggerContextResult,
            ChatTriggerType.INLINE_CHAT
        )

        // Verify that extra context was prepended to document text
        const documentText =
            chatParams.conversationState?.currentMessage?.userInputMessage?.userInputMessageContext?.editorState
                ?.document?.text
        assert.strictEqual(documentText, expectedDocumentText)

        // Verify that additionalContext is not used
        const additionalContext =
            chatParams.conversationState?.currentMessage?.userInputMessage?.userInputMessageContext?.additionalContext
        assert.strictEqual(additionalContext, undefined)
    })

    it('should not modify document text when extra context is empty', async () => {
        const originalDocumentText = 'const x = 1;'
        const mockConfig = {
            inlineChat: {
                extraContext: '',
            },
        }

        amazonQServiceManager.getConfiguration.returns(mockConfig)

        const mockDocumentContext = {
            text: originalDocumentText,
            programmingLanguage: { languageName: 'typescript' },
            relativeFilePath: 'test.ts',
            cursorState: { position: { line: 0, character: 0 } },
            hasCodeSnippet: false,
            totalEditorCharacters: originalDocumentText.length,
        }

        sinon.stub(triggerContext, 'extractDocumentContext').resolves(mockDocumentContext)

        const params = {
            prompt: {
                prompt: 'Explain this code',
                escapedPrompt: 'Explain this code',
            },
            textDocument: {
                uri: 'file:///test.ts',
            },
            cursorState: [{ position: { line: 0, character: 0 } }],
        }

        const triggerContextResult = await triggerContext.getNewTriggerContext(params)
        const chatParams = triggerContext.getChatParamsFromTrigger(params, triggerContextResult, ChatTriggerType.MANUAL)

        const documentText =
            chatParams.conversationState?.currentMessage?.userInputMessage?.userInputMessageContext?.editorState
                ?.document?.text
        assert.strictEqual(documentText, originalDocumentText)
    })

    it('should not modify document text when amazonQServiceManager is not available', async () => {
        const originalDocumentText = 'const x = 1;'
        const triggerContextWithoutManager = new QChatTriggerContext(testFeatures.workspace, testFeatures.logging)

        const mockDocumentContext = {
            text: originalDocumentText,
            programmingLanguage: { languageName: 'typescript' },
            relativeFilePath: 'test.ts',
            cursorState: { position: { line: 0, character: 0 } },
            hasCodeSnippet: false,
            totalEditorCharacters: originalDocumentText.length,
        }

        sinon.stub(triggerContextWithoutManager, 'extractDocumentContext').resolves(mockDocumentContext)

        const params = {
            prompt: {
                prompt: 'Explain this code',
                escapedPrompt: 'Explain this code',
            },
            textDocument: {
                uri: 'file:///test.ts',
            },
            cursorState: [{ position: { line: 0, character: 0 } }],
        }

        const triggerContextResult = await triggerContextWithoutManager.getNewTriggerContext(params)
        const chatParams = triggerContextWithoutManager.getChatParamsFromTrigger(
            params,
            triggerContextResult,
            ChatTriggerType.MANUAL
        )

        const documentText =
            chatParams.conversationState?.currentMessage?.userInputMessage?.userInputMessageContext?.editorState
                ?.document?.text
        assert.strictEqual(documentText, originalDocumentText)
    })

    it('should handle whitespace-only extra context', async () => {
        const originalDocumentText = 'const x = 1;'
        const mockConfig = {
            inlineChat: {
                extraContext: '   \n\t  ',
            },
        }

        amazonQServiceManager.getConfiguration.returns(mockConfig)

        const mockDocumentContext = {
            text: originalDocumentText,
            programmingLanguage: { languageName: 'typescript' },
            relativeFilePath: 'test.ts',
            cursorState: { position: { line: 0, character: 0 } },
            hasCodeSnippet: false,
            totalEditorCharacters: originalDocumentText.length,
        }

        sinon.stub(triggerContext, 'extractDocumentContext').resolves(mockDocumentContext)

        const params = {
            prompt: {
                prompt: 'Explain this code',
                escapedPrompt: 'Explain this code',
            },
            textDocument: {
                uri: 'file:///test.ts',
            },
            cursorState: [{ position: { line: 0, character: 0 } }],
        }

        const triggerContextResult = await triggerContext.getNewTriggerContext(params)
        const chatParams = triggerContext.getChatParamsFromTrigger(params, triggerContextResult, ChatTriggerType.MANUAL)

        const documentText =
            chatParams.conversationState?.currentMessage?.userInputMessage?.userInputMessageContext?.editorState
                ?.document?.text
        assert.strictEqual(documentText, originalDocumentText)
    })
})
