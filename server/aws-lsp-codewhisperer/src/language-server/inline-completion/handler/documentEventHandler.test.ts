import { DocumentEventHandler } from './documentEventHandler'

describe('DocumentEventHandler', () => {
    let handler: DocumentEventHandler
    let mockWorkspace: any
    let mockLogging: any
    let mockCodePercentageTracker: any
    let mockUserWrittenCodeTracker: any
    let mockRecentEditTracker: any
    let mockCursorTracker: any
    let mockCompletionSessionManager: any
    let mockAmazonQServiceManager: any
    let mockGetEditsEnabled: jest.Mock

    beforeEach(() => {
        mockWorkspace = { getTextDocument: jest.fn() }
        mockLogging = { log: jest.fn() }
        mockCodePercentageTracker = { countTotalTokens: jest.fn() }
        mockUserWrittenCodeTracker = { countUserWrittenTokens: jest.fn() }
        mockRecentEditTracker = {
            handleDocumentChange: jest.fn(),
            handleDocumentOpen: jest.fn(),
            handleDocumentClose: jest.fn(),
        }
        mockCursorTracker = { clearHistory: jest.fn() }
        mockCompletionSessionManager = { getCurrentSession: jest.fn() }
        mockAmazonQServiceManager = { getConfiguration: jest.fn() }
        mockGetEditsEnabled = jest.fn()

        handler = new DocumentEventHandler(
            mockWorkspace,
            mockLogging,
            mockCodePercentageTracker,
            mockUserWrittenCodeTracker,
            mockRecentEditTracker,
            mockCursorTracker,
            mockCompletionSessionManager,
            mockAmazonQServiceManager,
            mockGetEditsEnabled
        )
    })

    describe('onDidChangeTextDocument', () => {
        it('should return early if no text document', async () => {
            mockWorkspace.getTextDocument.mockResolvedValue(null)
            const params = { textDocument: { uri: 'test.ts' }, contentChanges: [] }

            await handler.onDidChangeTextDocument(params as any)

            expect(mockCodePercentageTracker.countTotalTokens).not.toHaveBeenCalled()
        })

        it('should count tokens and update modification time', async () => {
            const mockTextDocument = { languageId: 'typescript', getText: jest.fn() }
            mockWorkspace.getTextDocument.mockResolvedValue(mockTextDocument)
            mockAmazonQServiceManager.getConfiguration.mockReturnValue({ sendUserWrittenCodeMetrics: true })
            mockCompletionSessionManager.getCurrentSession.mockReturnValue(null)

            const params = {
                textDocument: { uri: 'test.ts' },
                contentChanges: [{ text: 'console.log()' }],
            }

            await handler.onDidChangeTextDocument(params as any)

            expect(mockCodePercentageTracker.countTotalTokens).toHaveBeenCalledWith(
                'typescript',
                'console.log()',
                false
            )
            expect(handler.timeSinceLastUserModification).toBeGreaterThanOrEqual(0)
        })
    })

    describe('onDidOpenTextDocument', () => {
        it('should log and track document open', () => {
            const params = {
                textDocument: {
                    uri: 'test.ts',
                    languageId: 'typescript',
                    version: 1,
                    text: 'content',
                },
            }

            handler.onDidOpenTextDocument(params as any)

            expect(mockLogging.log).toHaveBeenCalledWith('Document opened: test.ts')
            expect(mockRecentEditTracker.handleDocumentOpen).toHaveBeenCalledWith({
                uri: 'test.ts',
                languageId: 'typescript',
                version: 1,
                text: 'content',
            })
        })
    })

    describe('onDidCloseTextDocument', () => {
        it('should log and clear cursor history', () => {
            const params = { textDocument: { uri: 'test.ts' } }

            handler.onDidCloseTextDocument(params as any)

            expect(mockLogging.log).toHaveBeenCalledWith('Document closed: test.ts')
            expect(mockRecentEditTracker.handleDocumentClose).toHaveBeenCalledWith('test.ts')
            expect(mockCursorTracker.clearHistory).toHaveBeenCalledWith('test.ts')
        })
    })

    describe('setEditCompletionHandler', () => {
        it('should set and call edit completion handler', async () => {
            const mockHandler = { documentChanged: jest.fn() }
            handler.setEditCompletionHandler(mockHandler)

            const mockTextDocument = { languageId: 'typescript', getText: jest.fn() }
            mockWorkspace.getTextDocument.mockResolvedValue(mockTextDocument)
            mockAmazonQServiceManager.getConfiguration.mockReturnValue({ sendUserWrittenCodeMetrics: false })

            const params = {
                textDocument: { uri: 'test.ts' },
                contentChanges: [{ text: 'test' }],
            }

            await handler.onDidChangeTextDocument(params as any)

            expect(mockHandler.documentChanged).toHaveBeenCalled()
        })
    })
})
