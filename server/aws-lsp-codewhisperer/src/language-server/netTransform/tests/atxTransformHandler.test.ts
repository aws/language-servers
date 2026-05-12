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

describe('ATXTransformHandler - getTransformInfo', () => {
    let handler: ATXTransformHandler
    let serviceManager: AtxTokenServiceManager
    let workspace: Workspace
    let logging: Logging
    let runtime: Runtime
    let getJobStub: sinon.SinonStub
    let getTransformationPlanStub: sinon.SinonStub
    let listHitlsStub: sinon.SinonStub
    let listWorklogsStub: sinon.SinonStub
    let downloadFinalArtifactStub: sinon.SinonStub
    let getHitlAgentArtifactStub: sinon.SinonStub

    const baseRequest = {
        TransformationJobId: 'job-123',
        WorkspaceId: 'ws-123',
        SolutionRootPath: 'C:/sln',
    }

    beforeEach(() => {
        serviceManager = sinon.createStubInstance(AtxTokenServiceManager) as any
        workspace = {} as Workspace
        logging = { log: sinon.stub(), error: sinon.stub(), info: sinon.stub() } as any
        runtime = {} as Runtime

        handler = new ATXTransformHandler(serviceManager, workspace, logging, runtime)
        sinon.stub(handler as any, 'initializeAtxClient').resolves(true)
        ;(handler as any).atxClient = { send: sinon.stub() }

        getJobStub = sinon.stub(handler, 'getJob')
        getTransformationPlanStub = sinon.stub(handler, 'getTransformationPlan')
        listHitlsStub = sinon.stub(handler, 'listHitls')
        listWorklogsStub = sinon.stub(handler as any, 'listWorklogs').resolves(undefined)
        downloadFinalArtifactStub = sinon.stub(handler, 'downloadFinalArtifact')
        getHitlAgentArtifactStub = sinon.stub(handler, 'getHitlAgentArtifact')
    })

    afterEach(() => {
        sinon.restore()
    })

    it('should return JOB_NOT_FOUND when getJob returns null', async () => {
        getJobStub.resolves(null)

        const result = await handler.getTransformInfo(baseRequest)

        expect(result?.ErrorString).to.equal('JOB_NOT_FOUND')
        expect((logging.error as sinon.SinonStub).called).to.be.true
    })

    it('should return COMPLETED with artifact path and plan', async () => {
        getJobStub.resolves({ statusDetails: { status: 'COMPLETED' } })
        downloadFinalArtifactStub.resolves('C:/sln/artifact.zip')
        getTransformationPlanStub.resolves({ Root: { Children: [] } })

        const result = await handler.getTransformInfo(baseRequest)

        expect(result?.TransformationJob.Status).to.equal('COMPLETED')
        expect(result?.ArtifactPath).to.equal('C:/sln/artifact.zip')
        expect(result?.TransformationPlan).to.deep.equal({ Root: { Children: [] } })
    })

    it('should return FAILED with failureReason', async () => {
        getJobStub.resolves({
            statusDetails: { status: 'FAILED', failureReason: 'compile error' },
        })

        const result = await handler.getTransformInfo(baseRequest)

        expect(result?.TransformationJob.Status).to.equal('FAILED')
        expect((result?.TransformationJob as any).FailureReason).to.equal('compile error')
        expect(result?.ErrorString).to.equal('Transformation job failed')
    })

    it('should return STOPPED with error string', async () => {
        getJobStub.resolves({ statusDetails: { status: 'STOPPED' } })

        const result = await handler.getTransformInfo(baseRequest)

        expect(result?.TransformationJob.Status).to.equal('STOPPED')
        expect(result?.ErrorString).to.equal('Transformation job stopped')
    })

    it('should return EXECUTING with plan when no HITLs pending', async () => {
        getJobStub.resolves({ statusDetails: { status: 'EXECUTING' } })
        getTransformationPlanStub.resolves({ Root: { Children: [{ StepId: 's1', Children: [] }] } })
        listHitlsStub.resolves([])

        const result = await handler.getTransformInfo(baseRequest)

        expect(result?.TransformationJob.Status).to.equal('EXECUTING')
        expect(result?.TransformationPlan?.Root.Children).to.have.lengthOf(1)
    })

    it('should surface AWAITING_HUMAN_INPUT when EXECUTING with pending HITL', async () => {
        getJobStub.resolves({ statusDetails: { status: 'EXECUTING' } })
        getTransformationPlanStub.resolves({ Root: { Children: [] } })
        listHitlsStub.resolves([{ tag: 'local-build-verification', taskId: 'task-1' }])

        const result = await handler.getTransformInfo(baseRequest)

        expect(result?.TransformationJob.Status).to.equal('AWAITING_HUMAN_INPUT')
        expect(result?.HitlTag).to.equal('local-build-verification')
        expect(result?.HitlTaskId).to.equal('task-1')
    })

    it('should prefer local-build-verification over other HITL tags', async () => {
        getJobStub.resolves({ statusDetails: { status: 'EXECUTING' } })
        getTransformationPlanStub.resolves({ Root: { Children: [] } })
        listHitlsStub.resolves([
            { tag: 'missing-packages', taskId: 'task-mp' },
            { tag: 'local-build-verification', taskId: 'task-lbv' },
            { tag: 'other', taskId: 'task-other' },
        ])

        const result = await handler.getTransformInfo(baseRequest)

        expect(result?.HitlTag).to.equal('local-build-verification')
        expect(result?.HitlTaskId).to.equal('task-lbv')
    })

    it('should default to PLANNING-like fallthrough for unknown statuses', async () => {
        getJobStub.resolves({ statusDetails: { status: 'PLANNING' } })
        getTransformationPlanStub.resolves({ Root: { Children: [] } })
        listHitlsStub.resolves([])

        const result = await handler.getTransformInfo(baseRequest)

        expect(result?.TransformationJob.Status).to.equal('PLANNING')
        expect(listWorklogsStub.calledOnce).to.be.true
    })

    it('should set DiffApplyFailed flag when diff context records failures', async () => {
        getJobStub.resolves({ statusDetails: { status: 'EXECUTING' } })
        getTransformationPlanStub.callsFake(async () => {
            const ctx = (handler as any)._currentDiffContext
            if (ctx) {
                ctx.failed = true
                ctx.failedStepIds.push('step-x')
            }
            return { Root: { Children: [] } }
        })
        listHitlsStub.resolves([])

        const result = await handler.getTransformInfo(baseRequest)

        expect(result?.DiffApplyFailed).to.equal(true)
        expect(result?.DiffApplyFailedStepIds).to.deep.equal(['step-x'])
    })

    it('should clear diff context after the call (no leak across calls)', async () => {
        getJobStub.resolves({ statusDetails: { status: 'COMPLETED' } })
        downloadFinalArtifactStub.resolves('path')
        getTransformationPlanStub.resolves({ Root: { Children: [] } })

        await handler.getTransformInfo(baseRequest)

        expect((handler as any)._currentDiffContext).to.be.null
    })

    it('should parse interactive_mode from job objective on first call', async () => {
        getJobStub.resolves({
            statusDetails: { status: 'EXECUTING' },
            objective: '{"interactive_mode":"interactive"}',
        })
        getTransformationPlanStub.resolves({ Root: { Children: [] } })
        listHitlsStub.resolves([])

        await handler.getTransformInfo(baseRequest)

        expect((handler as any).cachedInteractiveMode).to.equal('Interactive')
    })

    it('should default cachedInteractiveMode to Autonomous when objective is unparseable', async () => {
        getJobStub.resolves({
            statusDetails: { status: 'EXECUTING' },
            objective: 'not-json',
        })
        getTransformationPlanStub.resolves({ Root: { Children: [] } })
        listHitlsStub.resolves([])

        await handler.getTransformInfo(baseRequest)

        expect((handler as any).cachedInteractiveMode).to.equal('Autonomous')
    })

    it('should return null when getJob throws', async () => {
        getJobStub.rejects(new Error('network'))

        const result = await handler.getTransformInfo(baseRequest)

        expect(result).to.be.null
        expect((logging.error as sinon.SinonStub).called).to.be.true
    })
})
