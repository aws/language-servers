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

describe('ATXTransformHandler - getTransformationPlan & helpers', () => {
    let handler: ATXTransformHandler
    let serviceManager: AtxTokenServiceManager
    let workspace: Workspace
    let logging: Logging
    let runtime: Runtime

    beforeEach(() => {
        serviceManager = sinon.createStubInstance(AtxTokenServiceManager) as any
        workspace = {} as Workspace
        logging = { log: sinon.stub(), error: sinon.stub(), info: sinon.stub() } as any
        runtime = {} as Runtime

        handler = new ATXTransformHandler(serviceManager, workspace, logging, runtime)
        sinon.stub(handler as any, 'initializeAtxClient').resolves(true)
        ;(handler as any).atxClient = { send: sinon.stub() }
    })

    afterEach(() => {
        sinon.restore()
    })

    describe('getTransformationPlan', () => {
        it('should return plan from fetchPlanTree on happy path', async () => {
            const plan = { Root: { StepId: 'root', Children: [{ StepId: 's1', Children: [] }] } } as any
            sinon.stub(handler as any, 'fetchPlanTree').resolves(plan)
            sinon.stub(handler as any, 'fetchWorklogs').resolves(undefined)
            sinon.stub(handler as any, 'downloadCompletedStepArtifacts').resolves(false)

            const result = await handler.getTransformationPlan('ws-1', 'job-1', 'C:/sln')

            expect(result.Root.Children).to.have.lengthOf(1)
            expect(result.Root.Children[0].StepId).to.equal('s1')
        })

        it('should return empty root when fetchPlanTree throws', async () => {
            sinon.stub(handler as any, 'fetchPlanTree').rejects(new Error('boom'))
            sinon.stub(handler as any, 'fetchWorklogs').resolves(undefined)

            const result = await handler.getTransformationPlan('ws-1', 'job-1', 'C:/sln')

            expect(result.Root.StepId).to.equal('root')
            expect(result.Root.Children).to.have.lengthOf(0)
            expect((logging.error as sinon.SinonStub).called).to.be.true
        })

        it('should mark diff context as failed when downloadCompletedStepArtifacts reports failure', async () => {
            const plan = { Root: { StepId: 'root', Children: [] } } as any
            sinon.stub(handler as any, 'fetchPlanTree').resolves(plan)
            sinon.stub(handler as any, 'fetchWorklogs').resolves(undefined)
            sinon.stub(handler as any, 'downloadCompletedStepArtifacts').resolves(true)
            ;(handler as any)._currentDiffContext = { failed: false, failedStepIds: [] }

            await handler.getTransformationPlan('ws-1', 'job-1', 'C:/sln')

            expect((handler as any)._currentDiffContext.failed).to.equal(true)
        })

        it('should not throw when fetchWorklogs rejects (fire-and-forget)', async () => {
            const plan = { Root: { StepId: 'root', Children: [] } } as any
            sinon.stub(handler as any, 'fetchPlanTree').resolves(plan)
            sinon.stub(handler as any, 'fetchWorklogs').rejects(new Error('worklog network'))
            sinon.stub(handler as any, 'downloadCompletedStepArtifacts').resolves(false)

            const result = await handler.getTransformationPlan('ws-1', 'job-1', 'C:/sln')

            expect(result.Root).to.exist
        })
    })

    describe('buildTreeFromFlatList', () => {
        it('should build a parent-child tree from flat list', () => {
            const flat = [
                { stepId: 'a', parentStepId: 'root', stepName: 'A', score: 1 },
                { stepId: 'b', parentStepId: 'a', stepName: 'B', score: 2 },
                { stepId: 'c', parentStepId: 'a', stepName: 'C', score: 3 },
            ]

            const tree = (handler as any).buildTreeFromFlatList(flat)

            expect(tree).to.have.lengthOf(1)
            expect(tree[0].StepId).to.equal('a')
            expect(tree[0].Children).to.have.lengthOf(2)
            expect(tree[0].Children.map((c: any) => c.StepId)).to.deep.equal(['b', 'c'])
        })

        it('should treat orphan steps (parent not in list) as root-level', () => {
            const flat = [
                { stepId: 'a', parentStepId: 'missing-parent', stepName: 'A' },
                { stepId: 'b', parentStepId: 'root', stepName: 'B' },
            ]

            const tree = (handler as any).buildTreeFromFlatList(flat)

            expect(tree).to.have.lengthOf(2)
            const ids = tree.map((s: any) => s.StepId).sort()
            expect(ids).to.deep.equal(['a', 'b'])
        })

        it('should sort children by score ascending', () => {
            const flat = [
                { stepId: 'p', parentStepId: 'root', stepName: 'P', score: 0 },
                { stepId: 'b', parentStepId: 'p', stepName: 'B', score: 30 },
                { stepId: 'a', parentStepId: 'p', stepName: 'A', score: 10 },
                { stepId: 'c', parentStepId: 'p', stepName: 'C', score: 20 },
            ]

            const tree = (handler as any).buildTreeFromFlatList(flat)

            expect(tree[0].Children.map((c: any) => c.StepId)).to.deep.equal(['a', 'c', 'b'])
        })

        it('should return empty array for empty input', () => {
            const tree = (handler as any).buildTreeFromFlatList([])
            expect(tree).to.deep.equal([])
        })
    })

    describe('mapApiStepToNode', () => {
        it('should map camelCase API fields to PascalCase node fields', () => {
            const node = (handler as any).mapApiStepToNode({
                stepId: 's1',
                parentStepId: 'p1',
                stepName: 'Name',
                description: 'Desc',
                status: 'SUCCEEDED',
                score: 5,
            })

            expect(node).to.deep.include({
                StepId: 's1',
                ParentStepId: 'p1',
                StepName: 'Name',
                Description: 'Desc',
                Status: 'SUCCEEDED',
                score: 5,
            })
            expect(node.Children).to.deep.equal([])
        })

        it('should convert parentStepId="root" to null', () => {
            const node = (handler as any).mapApiStepToNode({
                stepId: 's1',
                parentStepId: 'root',
                status: 'NOT_STARTED',
            })

            expect(node.ParentStepId).to.be.null
        })

        it('should default missing fields to safe values', () => {
            const node = (handler as any).mapApiStepToNode({})

            expect(node.StepId).to.equal('')
            expect(node.ParentStepId).to.be.null
            expect(node.Status).to.equal('NOT_STARTED')
            expect(node.score).to.equal(0)
        })
    })

    describe('findCompletedSteps', () => {
        it('should return only SUCCEEDED steps at depth 2', () => {
            // depth 0 = root, depth 1 = root's children, depth 2 = grandchildren
            const root = {
                StepId: 'root',
                Status: 'SUCCEEDED', // depth 0, must be ignored
                Children: [
                    {
                        StepId: 'lvl1',
                        Status: 'SUCCEEDED', // depth 1, must be ignored
                        Children: [
                            { StepId: 'g1', Status: 'SUCCEEDED', Children: [] },
                            { StepId: 'g2', Status: 'IN_PROGRESS', Children: [] },
                            { StepId: 'g3', Status: 'SUCCEEDED', Children: [] },
                        ],
                    },
                ],
            } as any

            const completed = (handler as any).findCompletedSteps(root)

            expect(completed.map((s: any) => s.StepId)).to.deep.equal(['g1', 'g3'])
        })

        it('should return empty when no SUCCEEDED at depth 2', () => {
            const root = {
                StepId: 'root',
                Status: 'NOT_STARTED',
                Children: [
                    {
                        StepId: 'lvl1',
                        Status: 'IN_PROGRESS',
                        Children: [{ StepId: 'g1', Status: 'IN_PROGRESS', Children: [] }],
                    },
                ],
            } as any

            const completed = (handler as any).findCompletedSteps(root)
            expect(completed).to.deep.equal([])
        })
    })

    describe('mapApiStatus', () => {
        it('should pass through valid statuses', () => {
            expect((handler as any).mapApiStatus('SUCCEEDED')).to.equal('SUCCEEDED')
            expect((handler as any).mapApiStatus('IN_PROGRESS')).to.equal('IN_PROGRESS')
        })

        it('should default to NOT_STARTED when status missing', () => {
            expect((handler as any).mapApiStatus(undefined)).to.equal('NOT_STARTED')
        })
    })
})
