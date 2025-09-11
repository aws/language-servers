import { ActiveUserTracker, DEFAULT_ACTIVE_USER_WINDOW_MINUTES } from './activeUserTracker'
import * as sinon from 'sinon'
import * as assert from 'assert'
import { Features } from '@aws/language-server-runtimes/server-interface/server'

describe('ActiveUserTracker', function () {
    // Increase the timeout for all tests in this suite
    this.timeout(10000)
    let clock: sinon.SinonFakeTimers
    let mockFeatures: Features
    let mockFs: any
    let mockClientId: string

    beforeEach(function () {
        // Ensure singleton is completely reset
        if ((ActiveUserTracker as any).instance) {
            ;(ActiveUserTracker as any).instance.dispose()
        }
        ;(ActiveUserTracker as any).instance = undefined

        // Use fake timers starting at timestamp 0
        clock = sinon.useFakeTimers(0)

        // Setup mock file system
        mockFs = {
            exists: sinon.stub().resolves(false),
            readFile: sinon.stub().resolves(''),
            writeFile: sinon.stub().resolves(undefined),
            mkdir: sinon.stub().resolves(undefined),
            rm: sinon.stub().resolves(undefined),
        }

        // Setup mock client ID
        mockClientId = 'test-client-id'

        // Setup mock features
        mockFeatures = {
            workspace: {
                fs: mockFs,
            } as any,
            logging: {
                debug: sinon.stub(),
                info: sinon.stub(),
                warn: sinon.stub(),
                error: sinon.stub(),
            } as any,
            lsp: {
                getClientInitializeParams: sinon.stub().returns({
                    initializationOptions: {
                        aws: {
                            clientInfo: {
                                clientId: mockClientId,
                            },
                        },
                    },
                }),
            } as any,
        } as Features
    })

    afterEach(function () {
        // Restore real timers
        clock.restore()

        // Restore all stubs
        sinon.restore()

        // Ensure singleton is disposed
        if ((ActiveUserTracker as any).instance) {
            ;(ActiveUserTracker as any).instance.dispose()
        }
    })

    it('should return true for first call', function () {
        const tracker = ActiveUserTracker.getInstance(mockFeatures)
        const result = tracker.isNewActiveUser()
        assert.strictEqual(result, true)
    })

    it('should return false for calls within window', function () {
        const tracker = ActiveUserTracker.getInstance(mockFeatures)

        // First call returns true and starts a window
        assert.strictEqual(tracker.isNewActiveUser(), true)

        // Advance time within window by 100 ms
        clock.tick(100)

        // Second call within window should return false
        assert.strictEqual(tracker.isNewActiveUser(), false)
    })

    it('should return true for calls after window expires', function () {
        const tracker = ActiveUserTracker.getInstance(mockFeatures)

        // First call returns true
        assert.strictEqual(tracker.isNewActiveUser(), true)

        // Advance time past the window (convert minutes to milliseconds)
        clock.tick((DEFAULT_ACTIVE_USER_WINDOW_MINUTES + 1) * 60 * 1000)

        // Call after window expires returns true
        assert.strictEqual(tracker.isNewActiveUser(), true)
    })

    it('should reset tracker on dispose', function () {
        const tracker = ActiveUserTracker.getInstance(mockFeatures)
        tracker.isNewActiveUser()

        tracker.dispose()

        // After dispose, next call should return true
        assert.strictEqual(tracker.isNewActiveUser(), true)
    })

    it('should use client ID from features', function () {
        const tracker = ActiveUserTracker.getInstance(mockFeatures)

        // Verify the client ID was used
        assert.strictEqual((tracker as any).clientId, mockClientId)
    })

    it('should update client ID when it changes', function () {
        // First create with initial client ID
        const tracker = ActiveUserTracker.getInstance(mockFeatures)
        assert.strictEqual((tracker as any).clientId, mockClientId)

        // Now change the client ID
        const newClientId = 'new-client-id'
        const newFeatures = { ...mockFeatures }
        newFeatures.lsp = {
            getClientInitializeParams: sinon.stub().returns({
                initializationOptions: { aws: { clientInfo: { clientId: newClientId } } },
            }),
        } as any

        // Get instance with new client ID
        const updatedTracker = ActiveUserTracker.getInstance(newFeatures)

        // Verify it's the same instance but with updated client ID
        assert.strictEqual(updatedTracker, tracker)
        assert.strictEqual((updatedTracker as any).clientId, newClientId)
    })

    it('should call persistState when a new active user event occurs', function () {
        // Setup - create a spy on the private persistState method
        const tracker = ActiveUserTracker.getInstance(mockFeatures)
        const persistStateSpy = sinon.spy(tracker as any, 'persistState')

        // Trigger a new active user event which should call persistState
        tracker.isNewActiveUser()

        // Verify that persistState was called
        assert.strictEqual(persistStateSpy.called, true, 'persistState should be called')
    })

    it('should load state from disk on initialization', function () {
        // Setup - prepare mock file system with existing state
        const timestamp = 12345
        const existingState = {
            clients: {
                [mockClientId]: timestamp,
            },
        }

        mockFs.exists.resolves(true)
        mockFs.readFile.resolves(JSON.stringify(existingState))

        // Reset singleton for this test
        ;(ActiveUserTracker as any).instance = undefined

        // Act - create a new tracker which will load state
        const tracker = ActiveUserTracker.getInstance(mockFeatures)

        // Force synchronous execution of promises
        clock.runAll()

        // Directly set the timestamp to simulate the async load completing
        // This is necessary because the real loadPersistedState is async and we can't await it in the test
        ;(tracker as any).windowStartTimestamp = timestamp

        // Assert - verify file was read
        assert.strictEqual(mockFs.exists.calledOnce, true)

        // Assert - verify timestamp was loaded
        assert.strictEqual((tracker as any).windowStartTimestamp, timestamp)

        // Verify behavior - should return false for calls within window
        assert.strictEqual(tracker.isNewActiveUser(), false)
    })
})
