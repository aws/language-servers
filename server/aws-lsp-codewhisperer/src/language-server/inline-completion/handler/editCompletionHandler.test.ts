import { EditCompletionHandler } from './editCompletionHandler'
import { InlineCompletionTriggerKind } from '@aws/language-server-runtimes/protocol'
import { EMPTY_RESULT } from '../contants/constants'

describe('EditCompletionHandler', () => {
    let handler: EditCompletionHandler
    let mockLogging: any
    let mockWorkspace: any
    let mockAmazonQServiceManager: any
    let mockSessionManager: any
    let mockCursorTracker: any
    let mockRecentEditsTracker: any
    let mockRejectedEditTracker: any
    let mockDocumentEventHandler: any
    let mockTelemetry: any
    let mockTelemetryService: any
    let mockCredentialsProvider: any
    let mockCodeWhispererService: any

    beforeEach(() => {
        mockLogging = { info: jest.fn(), warn: jest.fn(), log: jest.fn(), debug: jest.fn() }
        mockWorkspace = { getTextDocument: jest.fn(), getWorkspaceFolder: jest.fn() }
        mockCodeWhispererService = {
            generateSuggestions: jest.fn(),
            constructSupplementalContext: jest.fn(),
            customizationArn: undefined,
        }
        mockAmazonQServiceManager = { getCodewhispererService: jest.fn(() => mockCodeWhispererService) }
        mockSessionManager = {
            getCurrentSession: jest.fn(),
            createSession: jest.fn(),
            discardSession: jest.fn(),
            activateSession: jest.fn(),
            closeSession: jest.fn(),
        }
        mockCursorTracker = { trackPosition: jest.fn() }
        mockRecentEditsTracker = {}
        mockRejectedEditTracker = { isSimilarToRejected: jest.fn(() => false) }
        mockDocumentEventHandler = { timeSinceLastUserModification: 1000 }
        mockTelemetry = {}
        mockTelemetryService = {}
        mockCredentialsProvider = { getConnectionMetadata: jest.fn() }

        const clientMetadata = {
            processId: 123,
            rootUri: null,
            capabilities: {},
            initializationOptions: {
                aws: {
                    awsClientCapabilities: {
                        textDocument: {
                            inlineCompletionWithReferences: {
                                inlineEditSupport: true,
                            },
                        },
                    },
                },
            },
        }

        handler = new EditCompletionHandler(
            mockLogging,
            clientMetadata,
            mockWorkspace,
            mockAmazonQServiceManager,
            mockSessionManager,
            mockCursorTracker,
            mockRecentEditsTracker,
            mockRejectedEditTracker,
            mockDocumentEventHandler,
            mockTelemetry,
            mockTelemetryService,
            mockCredentialsProvider
        )
    })

    describe('onEditCompletion', () => {
        it('should return empty result when in progress', async () => {
            handler['isInProgress'] = true
            const params = {
                textDocument: { uri: 'test.ts' },
                position: { line: 0, character: 0 },
                context: { triggerKind: InlineCompletionTriggerKind.Automatic },
            }

            const result = await handler.onEditCompletion(params as any, {} as any)

            expect(result).toBe(EMPTY_RESULT)
            expect(mockLogging.info).toHaveBeenCalledWith('editCompletionHandler is WIP, skip the request')
        })

        it('should return empty result when text document not found', async () => {
            mockWorkspace.getTextDocument.mockResolvedValue(null)
            const params = {
                textDocument: { uri: 'test.ts' },
                position: { line: 0, character: 0 },
                context: { triggerKind: InlineCompletionTriggerKind.Automatic },
            }

            const result = await handler.onEditCompletion(params as any, {} as any)

            expect(result).toBe(EMPTY_RESULT)
            expect(mockLogging.warn).toHaveBeenCalledWith('textDocument [test.ts] not found')
        })

        it('should return empty result when service is not token service', async () => {
            const mockTextDocument = { languageId: 'typescript' }
            mockWorkspace.getTextDocument.mockResolvedValue(mockTextDocument)
            mockAmazonQServiceManager.getCodewhispererService.mockReturnValue({})

            const params = {
                textDocument: { uri: 'test.ts' },
                position: { line: 0, character: 0 },
                context: { triggerKind: InlineCompletionTriggerKind.Automatic },
            }

            const result = await handler.onEditCompletion(params as any, {} as any)

            expect(result).toBe(EMPTY_RESULT)
        })
    })

    describe('documentChanged', () => {
        it('should set hasDocumentChangedSinceInvocation when waiting', () => {
            handler['debounceTimeout'] = setTimeout(() => {}, 1000) as any
            handler['isWaiting'] = true

            handler.documentChanged()

            expect(handler['hasDocumentChangedSinceInvocation']).toBe(true)
        })

        it('should refresh timeout when not waiting', () => {
            const mockTimeout = { refresh: jest.fn() }
            handler['debounceTimeout'] = mockTimeout as any
            handler['isWaiting'] = false

            handler.documentChanged()

            expect(mockTimeout.refresh).toHaveBeenCalled()
        })

        it('should do nothing when no timeout exists', () => {
            handler['debounceTimeout'] = undefined

            expect(() => handler.documentChanged()).not.toThrow()
        })
    })

    describe('processSuggestionResponse', () => {
        it('should filter out similar rejected suggestions', async () => {
            mockRejectedEditTracker.isSimilarToRejected.mockReturnValue(true)
            const mockSession = {
                setSuggestionState: jest.fn(),
                id: 'session-1',
            }
            const suggestionResponse = {
                suggestions: [{ itemId: 'item-1', content: 'test content' }],
                responseContext: { requestId: 'req-1', nextToken: null },
            }

            const result = await handler.processSuggestionResponse(suggestionResponse as any, mockSession as any, true)

            expect(mockSession.setSuggestionState).toHaveBeenCalledWith('item-1', 'Reject')
            expect(result.items).toHaveLength(0)
        })

        it('should return suggestions when not rejected', async () => {
            const mockSession = {
                setSuggestionState: jest.fn(),
                id: 'session-1',
                setTimeToFirstRecommendation: jest.fn(),
            }
            const suggestionResponse = {
                suggestions: [{ itemId: 'item-1', content: 'test content' }],
                responseContext: { requestId: 'req-1', nextToken: null },
            }

            const result = await handler.processSuggestionResponse(suggestionResponse as any, mockSession as any, true)

            expect(result.items).toHaveLength(1)
            expect(result.items[0].insertText).toBe('test content')
            expect(result.items[0].isInlineEdit).toBe(true)
        })
    })
})
