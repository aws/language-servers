/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert'
import * as sinon from 'sinon'
import { CodewhispererServerFactory } from './codeWhispererServer'
import { RecentEditTracker } from './tracker/codeEditTracker'
import { CursorTracker } from './tracker/cursorTracker'
import { RejectedEditTracker } from './tracker/rejectedEditTracker'
import { SessionManager } from './session/sessionManager'

describe('CodeWhispererServer NEP Integration', function () {
    let sandbox: sinon.SinonSandbox

    beforeEach(function () {
        sandbox = sinon.createSandbox()
    })

    afterEach(function () {
        sandbox.restore()
        SessionManager.reset()
    })

    describe('NEP Tracker Initialization', function () {
        it('should initialize all NEP trackers when server is created', function () {
            // Mock the singleton getInstance methods
            const mockRecentEditTracker = {
                handleDocumentChange: sandbox.stub(),
                handleDocumentOpen: sandbox.stub(),
                handleDocumentClose: sandbox.stub(),
            }
            const mockCursorTracker = {
                updateCursorPosition: sandbox.stub(),
                clearHistory: sandbox.stub(),
            }
            const mockRejectedEditTracker = {
                trackRejection: sandbox.stub(),
                wasRecentlyRejected: sandbox.stub().returns(false),
            }

            const recentEditTrackerStub = sandbox
                .stub(RecentEditTracker, 'getInstance')
                .returns(mockRecentEditTracker as any)
            const cursorTrackerStub = sandbox.stub(CursorTracker, 'getInstance').returns(mockCursorTracker as any)
            const rejectedEditTrackerStub = sandbox
                .stub(RejectedEditTracker, 'getInstance')
                .returns(mockRejectedEditTracker as any)

            // Mock SessionManager
            sandbox.stub(SessionManager, 'getInstance').returns({
                getCurrentSession: sandbox.stub().returns(null),
            } as any)

            // Mock the editPredictionAutoTrigger function
            sandbox
                .stub(require('./auto-trigger/editPredictionAutoTrigger'), 'editPredictionAutoTrigger')
                .value(sandbox.stub().returns({ shouldTrigger: false }))

            // Create minimal mocks for the server dependencies
            const mockLsp = {
                addInitializer: sandbox.stub(),
                onDidChangeTextDocument: sandbox.stub(),
                onDidOpenTextDocument: sandbox.stub(),
                onDidCloseTextDocument: sandbox.stub(),
                onInitialized: sandbox.stub(),
                extensions: {
                    onInlineCompletionWithReferences: sandbox.stub(),
                    onLogInlineCompletionSessionResults: sandbox.stub(),
                },
                workspace: {
                    getConfiguration: sandbox.stub().resolves({}),
                },
            }

            const mockServiceManager = {
                createCodeWhispererService: sandbox.stub(),
                dispose: sandbox.stub(),
            }

            // Create the server
            const server = CodewhispererServerFactory(() => mockServiceManager as any)({
                credentialsProvider: {} as any,
                lsp: mockLsp as any,
                workspace: {
                    getWorkspaceFolder: sandbox.stub(),
                    getWorkspaceFolders: sandbox.stub().returns([]),
                    getTextDocument: sandbox.stub(),
                } as any,
                telemetry: { emitMetric: sandbox.stub() } as any,
                logging: {
                    debug: sandbox.stub(),
                    error: sandbox.stub(),
                    info: sandbox.stub(),
                    warn: sandbox.stub(),
                    log: sandbox.stub(),
                } as any,
                runtime: { serverInfo: { name: 'test', version: '1.0.0' } } as any,
                sdkInitializator: { initialize: sandbox.stub() } as any,
            })

            // Verify that all tracker singletons were requested
            assert.strictEqual(recentEditTrackerStub.calledOnce, true)
            assert.strictEqual(cursorTrackerStub.calledOnce, true)
            assert.strictEqual(rejectedEditTrackerStub.calledOnce, true)

            // Verify that LSP handlers were registered
            assert.strictEqual(mockLsp.addInitializer.calledOnce, true)
            assert.strictEqual(mockLsp.extensions.onInlineCompletionWithReferences.calledOnce, true)
            assert.strictEqual(mockLsp.onDidChangeTextDocument.calledOnce, true)
            assert.strictEqual(mockLsp.onDidOpenTextDocument.calledOnce, true)
            assert.strictEqual(mockLsp.onDidCloseTextDocument.calledOnce, true)
        })
    })

    describe('NEP Integration Points', function () {
        it('should verify editPredictionAutoTrigger is imported and available', function () {
            // This test verifies that the NEP auto-trigger functionality is properly imported
            const editPredictionAutoTrigger =
                require('./auto-trigger/editPredictionAutoTrigger').editPredictionAutoTrigger
            assert.strictEqual(typeof editPredictionAutoTrigger, 'function')
        })

        it('should verify tracker classes are available', function () {
            // Verify that all NEP tracker classes are properly imported and available
            assert.strictEqual(typeof RecentEditTracker, 'function')
            assert.strictEqual(typeof CursorTracker, 'function')
            assert.strictEqual(typeof RejectedEditTracker, 'function')

            // Verify they have the expected static methods
            assert.strictEqual(typeof RecentEditTracker.getInstance, 'function')
            assert.strictEqual(typeof CursorTracker.getInstance, 'function')
            assert.strictEqual(typeof RejectedEditTracker.getInstance, 'function')
        })
    })

    describe('Server Factory Function', function () {
        it('should create a server function when called with service manager factory', function () {
            const mockServiceManagerFactory = sandbox.stub().returns({
                createCodeWhispererService: sandbox.stub(),
                dispose: sandbox.stub(),
            })

            const serverFunction = CodewhispererServerFactory(mockServiceManagerFactory)

            assert.strictEqual(typeof serverFunction, 'function')
        })

        it('should handle server creation with minimal dependencies', function () {
            const mockServiceManager = {
                createCodeWhispererService: sandbox.stub(),
                dispose: sandbox.stub(),
            }

            // Mock all the tracker singletons
            sandbox.stub(RecentEditTracker, 'getInstance').returns({
                handleDocumentChange: sandbox.stub(),
                handleDocumentOpen: sandbox.stub(),
                handleDocumentClose: sandbox.stub(),
            } as any)

            sandbox.stub(CursorTracker, 'getInstance').returns({
                updateCursorPosition: sandbox.stub(),
                clearHistory: sandbox.stub(),
            } as any)

            sandbox.stub(RejectedEditTracker, 'getInstance').returns({
                trackRejection: sandbox.stub(),
                wasRecentlyRejected: sandbox.stub().returns(false),
            } as any)

            sandbox.stub(SessionManager, 'getInstance').returns({
                getCurrentSession: sandbox.stub().returns(null),
            } as any)

            // Mock the editPredictionAutoTrigger
            sandbox
                .stub(require('./auto-trigger/editPredictionAutoTrigger'), 'editPredictionAutoTrigger')
                .value(sandbox.stub().returns({ shouldTrigger: false }))

            const serverFunction = CodewhispererServerFactory(() => mockServiceManager)

            // Should not throw when creating the server
            assert.doesNotThrow(() => {
                serverFunction({
                    credentialsProvider: {} as any,
                    lsp: {
                        addInitializer: sandbox.stub(),
                        onDidChangeTextDocument: sandbox.stub(),
                        onDidOpenTextDocument: sandbox.stub(),
                        onDidCloseTextDocument: sandbox.stub(),
                        onInitialized: sandbox.stub(),
                        extensions: {
                            onInlineCompletionWithReferences: sandbox.stub(),
                            onLogInlineCompletionSessionResults: sandbox.stub(),
                        },
                        workspace: {
                            getConfiguration: sandbox.stub().resolves({}),
                        },
                    } as any,
                    workspace: {
                        getWorkspaceFolder: sandbox.stub(),
                        getWorkspaceFolders: sandbox.stub().returns([]),
                        getTextDocument: sandbox.stub(),
                    } as any,
                    telemetry: { emitMetric: sandbox.stub() } as any,
                    logging: {
                        debug: sandbox.stub(),
                        error: sandbox.stub(),
                        info: sandbox.stub(),
                        warn: sandbox.stub(),
                        log: sandbox.stub(),
                    } as any,
                    runtime: { serverInfo: { name: 'test', version: '1.0.0' } } as any,
                    sdkInitializator: { initialize: sandbox.stub() } as any,
                })
            })
        })
    })
})
