import * as assert from 'assert'
import { requiresPathAcceptance } from './toolShared'
import { TestFeatures } from '@aws/language-server-runtimes/testing'
import { Features } from '@aws/language-server-runtimes/server-interface/server'
import { URI } from 'vscode-uri'
import * as sinon from 'sinon'

describe('toolShared', () => {
    describe('requiresPathAcceptance', () => {
        let features: TestFeatures
        let mockLsp: Features['lsp']
        let mockLogging: Features['logging']

        beforeEach(() => {
            features = new TestFeatures()

            // Mock LSP with workspace folders
            mockLsp = {
                getClientInitializeParams: sinon.stub().returns({
                    workspaceFolders: [
                        { uri: 'file:///workspace/folder1', name: 'workspace1' },
                        { uri: 'file:///workspace/folder2', name: 'workspace2' },
                    ],
                }),
            } as unknown as Features['lsp']

            // Mock logging
            mockLogging = {
                info: sinon.spy(),
                warn: sinon.spy(),
                error: sinon.spy(),
                log: sinon.spy(),
                debug: sinon.spy(),
            } as unknown as Features['logging']
        })

        afterEach(() => {
            sinon.restore()
        })

        it('should not require acceptance if path is inside workspace folder', async () => {
            const result = await requiresPathAcceptance('/workspace/folder1/file.txt', mockLsp, mockLogging)
            assert.strictEqual(result.requiresAcceptance, false, 'Path inside workspace should not require acceptance')
        })

        it('should require acceptance if path is outside workspace folders', async () => {
            const result = await requiresPathAcceptance('/outside/workspace/file.txt', mockLsp, mockLogging)
            assert.strictEqual(result.requiresAcceptance, true, 'Path outside workspace should require acceptance')
        })

        it('should require acceptance if workspace folders are empty', async () => {
            const emptyLsp = {
                getClientInitializeParams: sinon.stub().returns({
                    workspaceFolders: [],
                }),
            } as unknown as Features['lsp']

            const result = await requiresPathAcceptance('/any/path/file.txt', emptyLsp, mockLogging)
            assert.strictEqual(
                result.requiresAcceptance,
                true,
                'Should require acceptance when workspace folders are empty'
            )
            sinon.assert.calledOnce(mockLogging.warn as sinon.SinonSpy)
        })

        it('should require acceptance if workspace folders are undefined', async () => {
            const undefinedLsp = {
                getClientInitializeParams: sinon.stub().returns({
                    workspaceFolders: undefined,
                }),
            } as unknown as Features['lsp']

            const result = await requiresPathAcceptance('/any/path/file.txt', undefinedLsp, mockLogging)
            assert.strictEqual(
                result.requiresAcceptance,
                true,
                'Should require acceptance when workspace folders are undefined'
            )
            sinon.assert.calledOnce(mockLogging.warn as sinon.SinonSpy)
        })

        it('should require acceptance if getClientInitializeParams returns undefined', async () => {
            const nullLsp = {
                getClientInitializeParams: sinon.stub().returns(undefined),
            } as unknown as Features['lsp']

            const result = await requiresPathAcceptance('/any/path/file.txt', nullLsp, mockLogging)
            assert.strictEqual(
                result.requiresAcceptance,
                true,
                'Should require acceptance when getClientInitializeParams returns undefined'
            )
            sinon.assert.calledOnce(mockLogging.warn as sinon.SinonSpy)
        })

        it('should require acceptance and log error if an exception occurs', async () => {
            const errorLsp = {
                getClientInitializeParams: sinon.stub().throws(new Error('Test error')),
            } as unknown as Features['lsp']

            const result = await requiresPathAcceptance('/any/path/file.txt', errorLsp, mockLogging)
            assert.strictEqual(result.requiresAcceptance, true, 'Should require acceptance when an error occurs')
            sinon.assert.calledOnce(mockLogging.error as sinon.SinonSpy)
        })
    })
})
