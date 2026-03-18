import { expect } from 'chai'
import * as sinon from 'sinon'
import { ATXTransformHandler } from '../atxTransformHandler'
import { AtxTokenServiceManager } from '../../../shared/amazonQServiceManager/AtxTokenServiceManager'
import { Logging, Runtime, Workspace } from '@aws/language-server-runtimes/server-interface'

describe('ATXTransformHandler - Chat APIs', () => {
    let handler: ATXTransformHandler
    let serviceManager: AtxTokenServiceManager
    let workspace: Workspace
    let logging: Logging
    let runtime: Runtime
    let sendStub: sinon.SinonStub
    let addAuthStub: sinon.SinonStub

    beforeEach(() => {
        serviceManager = sinon.createStubInstance(AtxTokenServiceManager) as any
        workspace = {} as Workspace
        logging = { log: sinon.stub(), error: sinon.stub() } as any
        runtime = {} as Runtime

        handler = new ATXTransformHandler(serviceManager, workspace, logging, runtime)

        // Stub the client initialization and auth
        sendStub = sinon.stub()
        addAuthStub = sinon.stub().resolves()

        sinon.stub(handler as any, 'initializeAtxClient').resolves(true)
        sinon.stub(handler as any, 'addAuthToCommand').callsFake(addAuthStub)
        ;(handler as any).atxClient = { send: sendStub }
    })

    afterEach(() => {
        sinon.restore()
    })

    describe('sendMessage', () => {
        it('should send message and return response without polling', async () => {
            const mockResponse = {
                message: { messageId: 'msg-123' },
            }
            sendStub.resolves(mockResponse)

            const result = await handler.sendMessage({
                workspaceId: 'ws-123',
                text: 'test message',
                skipPolling: true,
            })

            expect(result).to.deep.equal({ success: true, data: mockResponse })
            expect(sendStub.calledOnce).to.be.true
        })

        it('should send message with job context', async () => {
            const mockResponse = {
                message: { messageId: 'msg-123' },
            }
            sendStub.resolves(mockResponse)

            await handler.sendMessage({
                workspaceId: 'ws-123',
                jobId: 'job-456',
                text: 'test message',
                skipPolling: true,
            })

            const callArgs = sendStub.firstCall.args[0]
            expect(callArgs.input.metadata.resourcesOnScreen.workspace.jobs).to.exist
            expect(callArgs.input.metadata.resourcesOnScreen.workspace.jobs[0].jobId).to.equal('job-456')
        })

        it('should poll for response when skipPolling is false', async () => {
            const sendResponse = { message: { messageId: 'msg-123' } }
            const listResponse = { messageIds: ['msg-123', 'msg-456'] }
            const batchResponse = {
                messages: [
                    {
                        messageId: 'msg-456',
                        parentMessageId: 'msg-123',
                        messageOrigin: 'SYSTEM',
                        processingInfo: { messageType: 'FINAL_RESPONSE' },
                        text: 'Response text',
                        interactions: [],
                    },
                ],
            }

            sendStub.onFirstCall().resolves(sendResponse)
            sendStub.onSecondCall().resolves(listResponse)
            sendStub.onThirdCall().resolves(batchResponse)

            const result = await handler.sendMessage({
                workspaceId: 'ws-123',
                text: 'test message',
                skipPolling: false,
            })

            expect(result.success).to.be.true
            expect(result.data.response.text).to.equal('Response text')
            expect(sendStub.callCount).to.be.greaterThan(1)
        })

        it('should return note when no response within timeout', async function () {
            this.timeout(20000) // Increase timeout for polling test
            const sendResponse = { message: { messageId: 'msg-123' } }
            const listResponse = { messageIds: [] }

            sendStub.onFirstCall().resolves(sendResponse)
            sendStub.resolves(listResponse)

            const result = await handler.sendMessage({
                workspaceId: 'ws-123',
                text: 'test message',
                skipPolling: false,
            })

            expect(result.success).to.be.true
            expect(result.data.response).to.be.null
            expect(result.data.note).to.include('No final response')
        })
    })

    describe('listMessages', () => {
        it('should list messages for workspace', async () => {
            const mockResponse = {
                messageIds: ['msg-1', 'msg-2', 'msg-3'],
            }
            sendStub.resolves(mockResponse)

            const result = await handler.listMessages({
                workspaceId: 'ws-123',
            })

            expect(result.messageIds).to.have.lengthOf(3)
            expect(sendStub.calledOnce).to.be.true
        })

        it('should list messages with job context', async () => {
            const mockResponse = { messageIds: ['msg-1'] }
            sendStub.resolves(mockResponse)

            await handler.listMessages({
                workspaceId: 'ws-123',
                jobId: 'job-456',
            })

            const callArgs = sendStub.firstCall.args[0]
            expect(callArgs.input.metadata.resourcesOnScreen.workspace.jobs).to.exist
        })

        it('should support pagination parameters', async () => {
            const mockResponse = { messageIds: ['msg-1'], nextToken: 'token-123' }
            sendStub.resolves(mockResponse)

            await handler.listMessages({
                workspaceId: 'ws-123',
                maxResults: 10,
                nextToken: 'prev-token',
            })

            const callArgs = sendStub.firstCall.args[0]
            expect(callArgs.input.maxResults).to.equal(10)
            expect(callArgs.input.nextToken).to.equal('prev-token')
        })

        it('should support timestamp filter', async () => {
            const mockResponse = { messageIds: [] }
            sendStub.resolves(mockResponse)

            const timestamp = new Date('2024-01-01')
            await handler.listMessages({
                workspaceId: 'ws-123',
                startTimestamp: timestamp,
            })

            const callArgs = sendStub.firstCall.args[0]
            expect(callArgs.input.startTimestamp).to.equal(timestamp)
        })
    })

    describe('batchGetMessages', () => {
        it('should retrieve messages by IDs', async () => {
            const mockResponse = {
                messages: [
                    { messageId: 'msg-1', text: 'Message 1' },
                    { messageId: 'msg-2', text: 'Message 2' },
                ],
            }
            sendStub.resolves(mockResponse)

            const result = await handler.batchGetMessages({
                workspaceId: 'ws-123',
                messageIds: ['msg-1', 'msg-2'],
            })

            expect(result.messages).to.have.lengthOf(2)
            expect(sendStub.calledOnce).to.be.true
        })

        it('should pass workspace ID and message IDs correctly', async () => {
            const mockResponse = { messages: [] }
            sendStub.resolves(mockResponse)

            await handler.batchGetMessages({
                workspaceId: 'ws-123',
                messageIds: ['msg-1', 'msg-2', 'msg-3'],
            })

            const callArgs = sendStub.firstCall.args[0]
            expect(callArgs.input.workspaceId).to.equal('ws-123')
            expect(callArgs.input.messageIds).to.have.lengthOf(3)
        })
    })

    describe('error handling', () => {
        it('should throw error when client not initialized', async () => {
            ;(handler as any).atxClient = null
            sinon.restore()
            sinon.stub(handler as any, 'initializeAtxClient').resolves(false)

            try {
                await handler.sendMessage({
                    workspaceId: 'ws-123',
                    text: 'test',
                })
                expect.fail('Should have thrown error')
            } catch (error: any) {
                expect(error.message).to.include('not initialized')
            }
        })

        it('should log errors on API failure', async () => {
            sendStub.rejects(new Error('API Error'))

            try {
                await handler.sendMessage({
                    workspaceId: 'ws-123',
                    text: 'test',
                    skipPolling: true,
                })
                expect.fail('Should have thrown error')
            } catch (error: any) {
                expect((logging.error as sinon.SinonStub).called).to.be.true
            }
        })
    })
})
