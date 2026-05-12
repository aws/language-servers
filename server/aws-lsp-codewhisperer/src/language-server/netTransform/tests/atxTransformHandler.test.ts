import { expect } from 'chai'
import * as sinon from 'sinon'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { ATXTransformHandler } from '../atxTransformHandler'
import { workspaceFolderName } from '../utils'
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

describe('ATXTransformHandler - updateWorkspace & applyChanges', () => {
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

    describe('updateWorkspace', () => {
        it('should return error when no active step HITL is found', async () => {
            sinon.stub(handler as any, 'findStepLevelHitl').resolves(null)

            const result = await handler.updateWorkspace('ws-1', 'job-1', 'C:/sln', 'step-1')

            expect(result.Success).to.be.false
            expect(result.Error).to.equal('No active step HITL found')
        })

        it('should return error when createUpdateWorkspaceZip returns empty path', async () => {
            sinon.stub(handler as any, 'findStepLevelHitl').resolves({ taskId: 't1' })
            sinon.stub(handler as any, 'getModifiedFilesSinceCheckpoint').returns([])
            sinon.stub(handler as any, 'createUpdateWorkspaceZip').resolves('')

            const result = await handler.updateWorkspace('ws-1', 'job-1', 'C:/sln', 'step-1')

            expect(result.Success).to.be.false
            expect(result.Error).to.equal('Failed to create update workspace zip')
        })

        it('should return error when createArtifactUploadUrl fails', async () => {
            sinon.stub(handler as any, 'findStepLevelHitl').resolves({ taskId: 't1' })
            sinon.stub(handler as any, 'getModifiedFilesSinceCheckpoint').returns([])
            sinon.stub(handler as any, 'createUpdateWorkspaceZip').resolves('C:/zip.zip')
            sinon.stub(handler, 'createArtifactUploadUrl').resolves(null)

            const result = await handler.updateWorkspace('ws-1', 'job-1', 'C:/sln', 'step-1')

            expect(result.Success).to.be.false
            expect(result.Error).to.equal('Failed to create artifact upload URL')
        })

        it('should return success and clear cachedStepHitl on full happy path', async () => {
            ;(handler as any).cachedStepHitl = 'cached-task-id'
            sinon.stub(handler as any, 'getModifiedFilesSinceCheckpoint').returns([])
            sinon.stub(handler as any, 'createUpdateWorkspaceZip').resolves('C:/zip.zip')
            sinon.stub(handler, 'createArtifactUploadUrl').resolves({
                uploadUrl: 'https://s3/upload',
                uploadId: 'upload-1',
                requestHeaders: {},
            } as any)
            const utilsModule = require('../utils')
            sinon.stub(utilsModule.Utils, 'uploadArtifact').resolves(true)
            sinon.stub(handler, 'completeArtifactUpload').resolves({ success: true } as any)
            sinon.stub(handler, 'updateHitl').resolves({ ok: true })

            const result = await handler.updateWorkspace('ws-1', 'job-1', 'C:/sln', 'step-1')

            expect(result.Success).to.be.true
            expect((handler as any).cachedStepHitl).to.be.null
        })

        it('should return error when uploadArtifact fails', async () => {
            sinon.stub(handler as any, 'findStepLevelHitl').resolves({ taskId: 't1' })
            sinon.stub(handler as any, 'getModifiedFilesSinceCheckpoint').returns([])
            sinon.stub(handler as any, 'createUpdateWorkspaceZip').resolves('C:/zip.zip')
            sinon.stub(handler, 'createArtifactUploadUrl').resolves({
                uploadUrl: 'https://s3/upload',
                uploadId: 'upload-1',
                requestHeaders: {},
            } as any)
            const utilsModule = require('../utils')
            sinon.stub(utilsModule.Utils, 'uploadArtifact').resolves(false)

            const result = await handler.updateWorkspace('ws-1', 'job-1', 'C:/sln', 'step-1')

            expect(result.Success).to.be.false
            expect(result.Error).to.equal('Failed to upload update workspace zip to S3')
        })

        it('should return error when completeArtifactUpload fails', async () => {
            sinon.stub(handler as any, 'findStepLevelHitl').resolves({ taskId: 't1' })
            sinon.stub(handler as any, 'getModifiedFilesSinceCheckpoint').returns([])
            sinon.stub(handler as any, 'createUpdateWorkspaceZip').resolves('C:/zip.zip')
            sinon.stub(handler, 'createArtifactUploadUrl').resolves({
                uploadUrl: 'u',
                uploadId: 'upload-1',
                requestHeaders: {},
            } as any)
            const utilsModule = require('../utils')
            sinon.stub(utilsModule.Utils, 'uploadArtifact').resolves(true)
            sinon.stub(handler, 'completeArtifactUpload').resolves({ success: false } as any)

            const result = await handler.updateWorkspace('ws-1', 'job-1', 'C:/sln', 'step-1')

            expect(result.Success).to.be.false
            expect(result.Error).to.equal('Failed to complete artifact upload')
        })

        it('should return error when updateHitl returns null', async () => {
            sinon.stub(handler as any, 'findStepLevelHitl').resolves({ taskId: 't1' })
            sinon.stub(handler as any, 'getModifiedFilesSinceCheckpoint').returns([])
            sinon.stub(handler as any, 'createUpdateWorkspaceZip').resolves('C:/zip.zip')
            sinon.stub(handler, 'createArtifactUploadUrl').resolves({
                uploadUrl: 'u',
                uploadId: 'upload-1',
                requestHeaders: {},
            } as any)
            const utilsModule = require('../utils')
            sinon.stub(utilsModule.Utils, 'uploadArtifact').resolves(true)
            sinon.stub(handler, 'completeArtifactUpload').resolves({ success: true } as any)
            sinon.stub(handler, 'updateHitl').resolves(null)

            const result = await handler.updateWorkspace('ws-1', 'job-1', 'C:/sln', 'step-1')

            expect(result.Success).to.be.false
            expect(result.Error).to.equal('Failed to update workspace HITL')
        })

        it('should return error when client cannot be initialized', async () => {
            sinon.restore()
            logging = { log: sinon.stub(), error: sinon.stub(), info: sinon.stub() } as any
            handler = new ATXTransformHandler(serviceManager, workspace, logging, runtime)
            sinon.stub(handler as any, 'initializeAtxClient').resolves(false)
            ;(handler as any).atxClient = null

            const result = await handler.updateWorkspace('ws-1', 'job-1', 'C:/sln', 'step-1')

            expect(result.Success).to.be.false
            expect(result.Error).to.equal('ATX FES client not initialized')
        })
    })

    describe('applyChanges', () => {
        let tmpRoot: string
        let checkpointFolder: string
        let solutionRoot: string

        beforeEach(() => {
            // Create a fresh temp working tree for each test
            tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'atx-applychanges-'))
            checkpointFolder = path.join(tmpRoot, 'checkpoint')
            solutionRoot = path.join(tmpRoot, 'sln')
            fs.mkdirSync(path.join(checkpointFolder, 'after'), { recursive: true })
            fs.mkdirSync(solutionRoot, { recursive: true })
        })

        afterEach(() => {
            try {
                fs.rmSync(tmpRoot, { recursive: true, force: true })
            } catch {
                // best effort
            }
        })

        const writeMetadata = (data: any) => {
            fs.writeFileSync(path.join(checkpointFolder, 'metadata.json'), JSON.stringify(data))
        }

        it('should fail when metadata.json is missing', async () => {
            const result = await (handler as any).applyChanges(checkpointFolder, solutionRoot)

            expect(result.success).to.be.false
            expect(result.error).to.include('metadata.json not found')
        })

        it('should add files from after/ directory', async () => {
            const relPath = 'src/Added.cs'
            fs.mkdirSync(path.join(checkpointFolder, 'after', 'src'), { recursive: true })
            fs.writeFileSync(path.join(checkpointFolder, 'after', relPath), '// added')
            writeMetadata({ filesAdded: [relPath] })

            const result = await (handler as any).applyChanges(checkpointFolder, solutionRoot)

            expect(result.success).to.be.true
            expect(result.filesAdded).to.equal(1)
            expect(result.addedFiles).to.deep.equal([relPath])
            expect(fs.existsSync(path.join(solutionRoot, relPath))).to.be.true
        })

        it('should remove files listed in filesRemoved', async () => {
            const relPath = 'OldFile.cs'
            fs.writeFileSync(path.join(solutionRoot, relPath), '// old')
            writeMetadata({ filesRemoved: [relPath] })

            const result = await (handler as any).applyChanges(checkpointFolder, solutionRoot)

            expect(result.success).to.be.true
            expect(result.filesRemoved).to.equal(1)
            expect(fs.existsSync(path.join(solutionRoot, relPath))).to.be.false
        })

        it('should update files from after/ directory', async () => {
            const relPath = 'Existing.cs'
            fs.writeFileSync(path.join(solutionRoot, relPath), '// old content')
            fs.writeFileSync(path.join(checkpointFolder, 'after', relPath), '// new content')
            writeMetadata({ filesUpdated: [relPath] })

            const result = await (handler as any).applyChanges(checkpointFolder, solutionRoot)

            expect(result.success).to.be.true
            expect(result.filesUpdated).to.equal(1)
            expect(fs.readFileSync(path.join(solutionRoot, relPath), 'utf-8')).to.equal('// new content')
        })

        it('should move files according to movedFilesMap', async () => {
            fs.writeFileSync(path.join(solutionRoot, 'before.cs'), '// content')
            writeMetadata({
                movedFilesMap: [{ before: 'before.cs', after: 'newdir/after.cs' }],
            })

            const result = await (handler as any).applyChanges(checkpointFolder, solutionRoot)

            expect(result.success).to.be.true
            expect(result.filesMoved).to.equal(1)
            expect(fs.existsSync(path.join(solutionRoot, 'before.cs'))).to.be.false
            expect(fs.existsSync(path.join(solutionRoot, 'newdir/after.cs'))).to.be.true
        })

        it('should succeed with zero counts when metadata is empty', async () => {
            writeMetadata({})

            const result = await (handler as any).applyChanges(checkpointFolder, solutionRoot)

            expect(result.success).to.be.true
            expect(result.filesAdded).to.equal(0)
            expect(result.filesRemoved).to.equal(0)
            expect(result.filesUpdated).to.equal(0)
            expect(result.filesMoved).to.equal(0)
        })

        it('should skip removal when target file does not exist', async () => {
            writeMetadata({ filesRemoved: ['NotThere.cs'] })

            const result = await (handler as any).applyChanges(checkpointFolder, solutionRoot)

            expect(result.success).to.be.true
            expect(result.filesRemoved).to.equal(0)
        })

        it('should fail gracefully when metadata.json is invalid JSON', async () => {
            fs.writeFileSync(path.join(checkpointFolder, 'metadata.json'), '{not json')

            const result = await (handler as any).applyChanges(checkpointFolder, solutionRoot)

            expect(result.success).to.be.false
            expect(result.error).to.be.a('string')
        })
    })
})

describe('ATXTransformHandler - setCheckpoints, getHitlAgentArtifact, getJobDashboard', () => {
    let handler: ATXTransformHandler
    let serviceManager: AtxTokenServiceManager
    let workspace: Workspace
    let logging: Logging
    let runtime: Runtime
    let tmpRoot: string

    beforeEach(() => {
        serviceManager = sinon.createStubInstance(AtxTokenServiceManager) as any
        workspace = {} as Workspace
        logging = { log: sinon.stub(), error: sinon.stub(), info: sinon.stub() } as any
        runtime = {} as Runtime

        handler = new ATXTransformHandler(serviceManager, workspace, logging, runtime)
        sinon.stub(handler as any, 'initializeAtxClient').resolves(true)
        ;(handler as any).atxClient = { send: sinon.stub() }

        tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'atx-batch-'))
    })

    afterEach(() => {
        sinon.restore()
        try {
            fs.rmSync(tmpRoot, { recursive: true, force: true })
        } catch {
            // best effort
        }
    })

    describe('setCheckpoints', () => {
        it('should return error when no checkpoint-settings HITL is found', async () => {
            sinon.stub(handler as any, 'findCheckpointSettingsHitl').resolves(null)

            const result = await handler.setCheckpoints('ws-1', 'job-1', tmpRoot, {})

            expect(result.Success).to.be.false
            expect(result.Error).to.equal('No HITL task found with checkpoint-settings tag')
        })

        it('should return error when client cannot be initialized', async () => {
            sinon.restore()
            logging = { log: sinon.stub(), error: sinon.stub(), info: sinon.stub() } as any
            handler = new ATXTransformHandler(serviceManager, workspace, logging, runtime)
            sinon.stub(handler as any, 'initializeAtxClient').resolves(false)
            ;(handler as any).atxClient = null

            const result = await handler.setCheckpoints('ws-1', 'job-1', tmpRoot, {})

            expect(result.Success).to.be.false
            expect(result.Error).to.equal('ATX FES client not initialized')
        })

        it('should write checkpoint-settings.json with mapped interactive_mode and succeed', async () => {
            sinon.stub(handler as any, 'findCheckpointSettingsHitl').resolves({ taskId: 't1' })
            sinon.stub(handler, 'createArtifactUploadUrl').resolves({
                uploadUrl: 'u',
                uploadId: 'upload-1',
                requestHeaders: {},
            } as any)
            const utilsModule = require('../utils')
            sinon.stub(utilsModule.Utils, 'uploadArtifact').resolves(true)
            sinon.stub(handler, 'completeArtifactUpload').resolves({ success: true } as any)
            sinon.stub(handler, 'updateHitl').resolves({ ok: true })

            const result = await handler.setCheckpoints(
                'ws-1',
                'job-1',
                tmpRoot,
                { 'step-a': true, 'step-b': false },
                'Interactive'
            )

            expect(result.Success).to.be.true
            const settingsPath = path.join(
                tmpRoot,
                workspaceFolderName,
                'job-1',
                'checkpoints',
                'checkpoint-settings.json'
            )
            expect(fs.existsSync(settingsPath)).to.be.true
            const written = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
            expect(written['step-a']).to.equal(true)
            expect(written.interactive_mode).to.equal('interactive')
        })

        it('should map Autonomous mode to "auto"', async () => {
            sinon.stub(handler as any, 'findCheckpointSettingsHitl').resolves({ taskId: 't1' })
            sinon.stub(handler, 'createArtifactUploadUrl').resolves({
                uploadUrl: 'u',
                uploadId: 'upload-1',
                requestHeaders: {},
            } as any)
            const utilsModule = require('../utils')
            sinon.stub(utilsModule.Utils, 'uploadArtifact').resolves(true)
            sinon.stub(handler, 'completeArtifactUpload').resolves({ success: true } as any)
            sinon.stub(handler, 'updateHitl').resolves({ ok: true })

            await handler.setCheckpoints('ws-1', 'job-1', tmpRoot, {}, 'Autonomous')

            const settingsPath = path.join(
                tmpRoot,
                workspaceFolderName,
                'job-1',
                'checkpoints',
                'checkpoint-settings.json'
            )
            const written = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
            expect(written.interactive_mode).to.equal('auto')
        })

        it('should return error when uploadArtifact fails', async () => {
            sinon.stub(handler as any, 'findCheckpointSettingsHitl').resolves({ taskId: 't1' })
            sinon.stub(handler, 'createArtifactUploadUrl').resolves({
                uploadUrl: 'u',
                uploadId: 'upload-1',
                requestHeaders: {},
            } as any)
            const utilsModule = require('../utils')
            sinon.stub(utilsModule.Utils, 'uploadArtifact').resolves(false)

            const result = await handler.setCheckpoints('ws-1', 'job-1', tmpRoot, {})

            expect(result.Success).to.be.false
            expect(result.Error).to.equal('Failed to upload checkpoints artifact to S3')
        })

        it('should return error when updateHitl fails', async () => {
            sinon.stub(handler as any, 'findCheckpointSettingsHitl').resolves({ taskId: 't1' })
            sinon.stub(handler, 'createArtifactUploadUrl').resolves({
                uploadUrl: 'u',
                uploadId: 'upload-1',
                requestHeaders: {},
            } as any)
            const utilsModule = require('../utils')
            sinon.stub(utilsModule.Utils, 'uploadArtifact').resolves(true)
            sinon.stub(handler, 'completeArtifactUpload').resolves({ success: true } as any)
            sinon.stub(handler, 'updateHitl').resolves(null)

            const result = await handler.setCheckpoints('ws-1', 'job-1', tmpRoot, {})

            expect(result.Success).to.be.false
            expect(result.Error).to.equal('Failed to update HITL task with checkpoints artifact')
        })
    })

    describe('getHitlAgentArtifact', () => {
        it('should return null when listHitls returns empty', async () => {
            sinon.stub(handler, 'listHitls').resolves([])

            const result = await handler.getHitlAgentArtifact('ws-1', 'job-1', tmpRoot)

            expect(result).to.be.null
        })

        it('should return null when listHitls returns null', async () => {
            sinon.stub(handler, 'listHitls').resolves(null)

            const result = await handler.getHitlAgentArtifact('ws-1', 'job-1', tmpRoot)

            expect(result).to.be.null
        })

        it('should return tag and taskId early for local-build-verification HITL (no download)', async () => {
            sinon.stub(handler, 'listHitls').resolves([{ tag: 'local-build-verification', taskId: 'task-lbv' }])
            const downloadStub = sinon.stub(handler, 'createArtifactDownloadUrl')

            const result = await handler.getHitlAgentArtifact('ws-1', 'job-1', tmpRoot)

            expect(result).to.deep.equal({ HitlTag: 'local-build-verification', TaskId: 'task-lbv' })
            expect(downloadStub.called).to.be.false
            expect((handler as any).cachedHitl).to.equal('task-lbv')
        })

        it('should return tag and taskId when HITL has no agentArtifact', async () => {
            sinon.stub(handler, 'listHitls').resolves([{ tag: 'some-tag', taskId: 'task-1' /* no agentArtifact */ }])

            const result = await handler.getHitlAgentArtifact('ws-1', 'job-1', tmpRoot)

            expect(result?.HitlTag).to.equal('some-tag')
            expect(result?.TaskId).to.equal('task-1')
        })

        it('should pick local-build-verification over other HITL tags when both present', async () => {
            sinon.stub(handler, 'listHitls').resolves([
                { tag: 'missing-packages', taskId: 'task-mp' },
                { tag: 'local-build-verification', taskId: 'task-lbv' },
            ])

            const result = await handler.getHitlAgentArtifact('ws-1', 'job-1', tmpRoot)

            expect(result?.HitlTag).to.equal('local-build-verification')
            expect(result?.TaskId).to.equal('task-lbv')
        })

        it('should return guardrail tag/taskId when download URL fails', async () => {
            sinon.stub(handler, 'listHitls').resolves([
                {
                    tag: 'plan-review',
                    taskId: 'task-1',
                    agentArtifact: { artifactId: 'art-1' },
                },
            ])
            sinon.stub(handler, 'createArtifactDownloadUrl').resolves(null)

            const result = await handler.getHitlAgentArtifact('ws-1', 'job-1', tmpRoot)

            expect(result?.HitlTag).to.equal('plan-review')
            expect(result?.TaskId).to.equal('task-1')
        })
    })

    describe('getJobDashboard', () => {
        it('should throw and return null when client cannot initialize', async () => {
            sinon.restore()
            logging = { log: sinon.stub(), error: sinon.stub(), info: sinon.stub() } as any
            handler = new ATXTransformHandler(serviceManager, workspace, logging, runtime)
            sinon.stub(handler as any, 'initializeAtxClient').resolves(false)
            ;(handler as any).atxClient = null

            const result = await handler.getJobDashboard('ws-1', 'job-1')

            expect(result).to.be.null
            expect((logging.error as sinon.SinonStub).called).to.be.true
        })

        it('should return null when no DASHBOARD HITL task exists', async () => {
            const sendStub = (handler as any).atxClient.send as sinon.SinonStub
            sendStub.resolves({ hitlTasks: [] })

            const result = await handler.getJobDashboard('ws-1', 'job-1')

            expect(result).to.be.null
        })

        it('should return null when DASHBOARD task has no agent artifact', async () => {
            const sendStub = (handler as any).atxClient.send as sinon.SinonStub
            sendStub.resolves({ hitlTasks: [{ taskId: 't1' /* no agentArtifact */ }] })

            const result = await handler.getJobDashboard('ws-1', 'job-1')

            expect(result).to.be.null
        })

        it('should return null on send error (caught and logged)', async () => {
            const sendStub = (handler as any).atxClient.send as sinon.SinonStub
            sendStub.rejects(new Error('AWS SDK failure'))

            const result = await handler.getJobDashboard('ws-1', 'job-1')

            expect(result).to.be.null
            expect((logging.error as sinon.SinonStub).called).to.be.true
        })
    })
})

describe('ATXTransformHandler - lifecycle (startTransform & helpers)', () => {
    let handler: ATXTransformHandler
    let serviceManager: AtxTokenServiceManager
    let workspace: Workspace
    let logging: Logging
    let runtime: Runtime
    let sendStub: sinon.SinonStub

    beforeEach(() => {
        serviceManager = sinon.createStubInstance(AtxTokenServiceManager) as any
        workspace = {} as Workspace
        logging = { log: sinon.stub(), error: sinon.stub(), info: sinon.stub() } as any
        runtime = {} as Runtime

        handler = new ATXTransformHandler(serviceManager, workspace, logging, runtime)
        sendStub = sinon.stub()
        sinon.stub(handler as any, 'initializeAtxClient').resolves(true)
        sinon.stub(handler as any, 'addAuthToCommand').resolves()
        ;(handler as any).atxClient = { send: sendStub }
    })

    afterEach(() => {
        sinon.restore()
    })

    describe('createJob', () => {
        it('should return jobId/status on success', async () => {
            sendStub.resolves({ jobId: 'job-123', status: 'CREATED' })

            const result = await handler.createJob({ workspaceId: 'ws-1' })

            expect(result).to.deep.equal({ jobId: 'job-123', status: 'CREATED' })
        })

        it('should return null when response missing jobId', async () => {
            sendStub.resolves({ status: 'CREATED' /* no jobId */ })

            const result = await handler.createJob({ workspaceId: 'ws-1' })

            expect(result).to.be.null
            expect((logging.error as sinon.SinonStub).called).to.be.true
        })

        it('should return null and log error when send rejects', async () => {
            sendStub.rejects(new Error('AWS down'))

            const result = await handler.createJob({ workspaceId: 'ws-1' })

            expect(result).to.be.null
            expect((logging.error as sinon.SinonStub).called).to.be.true
        })

        it('should map Interactive interactive_mode to "interactive" in objective', async () => {
            sendStub.resolves({ jobId: 'j', status: 'CREATED' })

            await handler.createJob({ workspaceId: 'ws-1', interactiveMode: 'Interactive' })

            const command = sendStub.firstCall.args[0]
            const objective = JSON.parse(command.input.objective)
            expect(objective.interactive_mode).to.equal('interactive')
        })

        it('should default interactive_mode to "auto" when mode not specified', async () => {
            sendStub.resolves({ jobId: 'j', status: 'CREATED' })

            await handler.createJob({ workspaceId: 'ws-1' })

            const command = sendStub.firstCall.args[0]
            const objective = JSON.parse(command.input.objective)
            expect(objective.interactive_mode).to.equal('auto')
        })
    })

    describe('createArtifactUploadUrl', () => {
        it('should return uploadId/uploadUrl on success', async () => {
            const utilsModule = require('../utils')
            sinon.stub(utilsModule.Utils, 'getSha256Async').resolves('abc-sha256')
            sendStub.resolves({
                artifactId: 'art-1',
                s3PreSignedUrl: 'https://s3/upload',
                requestHeaders: { 'x-foo': 'bar' },
            })

            const result = await handler.createArtifactUploadUrl(
                'ws-1',
                'job-1',
                'C:/file.zip',
                'CUSTOMER_INPUT' as any,
                'ZIP' as any
            )

            expect(result?.uploadId).to.equal('art-1')
            expect(result?.uploadUrl).to.equal('https://s3/upload')
            expect(result?.requestHeaders).to.deep.equal({ 'x-foo': 'bar' })
        })

        it('should return null when response missing required fields', async () => {
            const utilsModule = require('../utils')
            sinon.stub(utilsModule.Utils, 'getSha256Async').resolves('sha')
            sendStub.resolves({ artifactId: 'art-1' /* no s3PreSignedUrl */ })

            const result = await handler.createArtifactUploadUrl(
                'ws-1',
                'job-1',
                'C:/file.zip',
                'CUSTOMER_INPUT' as any,
                'ZIP' as any
            )

            expect(result).to.be.null
            expect((logging.error as sinon.SinonStub).called).to.be.true
        })

        it('should return null and log on send error', async () => {
            const utilsModule = require('../utils')
            sinon.stub(utilsModule.Utils, 'getSha256Async').resolves('sha')
            sendStub.rejects(new Error('boom'))

            const result = await handler.createArtifactUploadUrl(
                'ws-1',
                'job-1',
                'C:/file.zip',
                'CUSTOMER_INPUT' as any,
                'ZIP' as any
            )

            expect(result).to.be.null
        })
    })

    describe('completeArtifactUpload', () => {
        it('should return success=true on resolve', async () => {
            sendStub.resolves({
                /* server response */
            })

            const result = await handler.completeArtifactUpload('ws-1', 'job-1', 'art-1')

            expect(result).to.deep.equal({ success: true })
        })

        it('should return null on send error', async () => {
            sendStub.rejects(new Error('boom'))

            const result = await handler.completeArtifactUpload('ws-1', 'job-1', 'art-1')

            expect(result).to.be.null
            expect((logging.error as sinon.SinonStub).called).to.be.true
        })
    })

    describe('startJob', () => {
        it('should return success=true on resolve', async () => {
            sendStub.resolves({
                /* aws ack */
            })

            const result = await handler.startJob('ws-1', 'job-1')

            expect(result).to.deep.equal({ success: true })
        })

        it('should return null on send error', async () => {
            sendStub.rejects(new Error('boom'))

            const result = await handler.startJob('ws-1', 'job-1')

            expect(result).to.be.null
            expect((logging.error as sinon.SinonStub).called).to.be.true
        })
    })

    describe('startTransform', () => {
        it('should return null when createJob returns null', async () => {
            sinon.stub(handler, 'createJob').resolves(null)

            const result = await handler.startTransform({
                workspaceId: 'ws-1',
                startTransformRequest: { TargetFramework: 'net8.0' },
            })

            expect(result).to.be.null
        })

        it('should return null when createZip throws', async () => {
            sinon.stub(handler, 'createJob').resolves({ jobId: 'job-1', status: 'CREATED' })
            sinon.stub(handler, 'createZip').rejects(new Error('zip fail'))

            const result = await handler.startTransform({
                workspaceId: 'ws-1',
                startTransformRequest: {},
            })

            expect(result).to.be.null
            expect((logging.error as sinon.SinonStub).called).to.be.true
        })

        it('should return null when createArtifactUploadUrl returns null', async () => {
            sinon.stub(handler, 'createJob').resolves({ jobId: 'job-1', status: 'CREATED' })
            sinon.stub(handler, 'createZip').resolves('C:/zip.zip')
            sinon.stub(handler, 'createArtifactUploadUrl').resolves(null)

            const result = await handler.startTransform({
                workspaceId: 'ws-1',
                startTransformRequest: {},
            })

            expect(result).to.be.null
        })

        it('should return null when uploadArtifact returns false', async () => {
            sinon.stub(handler, 'createJob').resolves({ jobId: 'job-1', status: 'CREATED' })
            sinon.stub(handler, 'createZip').resolves('C:/zip.zip')
            sinon.stub(handler, 'createArtifactUploadUrl').resolves({
                uploadId: 'u',
                uploadUrl: 'https://s3',
                requestHeaders: {},
            } as any)
            const utilsModule = require('../utils')
            sinon.stub(utilsModule.Utils, 'uploadArtifact').resolves(false)

            const result = await handler.startTransform({
                workspaceId: 'ws-1',
                startTransformRequest: {},
            })

            expect(result).to.be.null
        })

        it('should return null when completeArtifactUpload returns null', async () => {
            sinon.stub(handler, 'createJob').resolves({ jobId: 'job-1', status: 'CREATED' })
            sinon.stub(handler, 'createZip').resolves('C:/zip.zip')
            sinon.stub(handler, 'createArtifactUploadUrl').resolves({
                uploadId: 'u',
                uploadUrl: 'https://s3',
                requestHeaders: {},
            } as any)
            const utilsModule = require('../utils')
            sinon.stub(utilsModule.Utils, 'uploadArtifact').resolves(true)
            sinon.stub(handler, 'completeArtifactUpload').resolves(null)

            const result = await handler.startTransform({
                workspaceId: 'ws-1',
                startTransformRequest: {},
            })

            expect(result).to.be.null
        })

        it('should return null when startJob returns null', async () => {
            sinon.stub(handler, 'createJob').resolves({ jobId: 'job-1', status: 'CREATED' })
            sinon.stub(handler, 'createZip').resolves('C:/zip.zip')
            sinon.stub(handler, 'createArtifactUploadUrl').resolves({
                uploadId: 'u',
                uploadUrl: 'https://s3',
                requestHeaders: {},
            } as any)
            const utilsModule = require('../utils')
            sinon.stub(utilsModule.Utils, 'uploadArtifact').resolves(true)
            sinon.stub(handler, 'completeArtifactUpload').resolves({ success: true })
            sinon.stub(handler, 'startJob').resolves(null)

            const result = await handler.startTransform({
                workspaceId: 'ws-1',
                startTransformRequest: {},
            })

            expect(result).to.be.null
        })

        it('should return TransformationJobId on full happy path', async () => {
            sinon.stub(handler, 'createJob').resolves({ jobId: 'job-1', status: 'CREATED' })
            sinon.stub(handler, 'createZip').resolves('C:/zip.zip')
            sinon.stub(handler, 'createArtifactUploadUrl').resolves({
                uploadId: 'upload-1',
                uploadUrl: 'https://s3',
                requestHeaders: {},
            } as any)
            const utilsModule = require('../utils')
            sinon.stub(utilsModule.Utils, 'uploadArtifact').resolves(true)
            sinon.stub(handler, 'completeArtifactUpload').resolves({ success: true })
            sinon.stub(handler, 'startJob').resolves({ success: true })

            const result = await handler.startTransform({
                workspaceId: 'ws-1',
                startTransformRequest: {},
            })

            expect(result?.TransformationJobId).to.equal('job-1')
            expect(result?.ArtifactPath).to.equal('C:/zip.zip')
            expect(result?.UploadId).to.equal('upload-1')
        })

        it('should cache interactive mode from request', async () => {
            sinon.stub(handler, 'createJob').resolves({ jobId: 'job-1', status: 'CREATED' })
            sinon.stub(handler, 'createZip').resolves('C:/zip.zip')
            sinon.stub(handler, 'createArtifactUploadUrl').resolves({
                uploadId: 'u',
                uploadUrl: 'https://s3',
                requestHeaders: {},
            } as any)
            const utilsModule = require('../utils')
            sinon.stub(utilsModule.Utils, 'uploadArtifact').resolves(true)
            sinon.stub(handler, 'completeArtifactUpload').resolves({ success: true })
            sinon.stub(handler, 'startJob').resolves({ success: true })

            await handler.startTransform({
                workspaceId: 'ws-1',
                interactiveMode: 'Interactive',
                startTransformRequest: {},
            })

            expect((handler as any).cachedInteractiveMode).to.equal('Interactive')
        })

        it('should default cached interactive mode to Autonomous when not specified', async () => {
            sinon.stub(handler, 'createJob').resolves({ jobId: 'job-1', status: 'CREATED' })
            sinon.stub(handler, 'createZip').resolves('C:/zip.zip')
            sinon.stub(handler, 'createArtifactUploadUrl').resolves({
                uploadId: 'u',
                uploadUrl: 'https://s3',
                requestHeaders: {},
            } as any)
            const utilsModule = require('../utils')
            sinon.stub(utilsModule.Utils, 'uploadArtifact').resolves(true)
            sinon.stub(handler, 'completeArtifactUpload').resolves({ success: true })
            sinon.stub(handler, 'startJob').resolves({ success: true })

            await handler.startTransform({
                workspaceId: 'ws-1',
                startTransformRequest: {},
            })

            expect((handler as any).cachedInteractiveMode).to.equal('Autonomous')
        })
    })
})

describe('ATXTransformHandler - workspace, job, artifact, HITL helpers', () => {
    let handler: ATXTransformHandler
    let serviceManager: any
    let workspace: Workspace
    let logging: Logging
    let runtime: Runtime
    let sendStub: sinon.SinonStub

    beforeEach(() => {
        serviceManager = sinon.createStubInstance(AtxTokenServiceManager) as any
        // Stub the methods getActiveTransformProfileApplicationUrl etc. depend on
        serviceManager.getActiveApplicationUrl = sinon.stub().returns('https://app.example.com')
        serviceManager.getBearerToken = sinon.stub().resolves('token')
        workspace = {} as Workspace
        logging = { log: sinon.stub(), error: sinon.stub(), info: sinon.stub() } as any
        runtime = {} as Runtime

        handler = new ATXTransformHandler(serviceManager, workspace, logging, runtime)
        sendStub = sinon.stub()
        sinon.stub(handler as any, 'initializeAtxClient').resolves(true)
        sinon.stub(handler as any, 'addAuthToCommand').resolves()
        ;(handler as any).atxClient = { send: sendStub }
    })

    afterEach(() => {
        sinon.restore()
    })

    describe('getActiveTransformProfileApplicationUrl', () => {
        it('should return the cached application URL', async () => {
            const result = await handler.getActiveTransformProfileApplicationUrl()
            expect(result).to.equal('https://app.example.com')
        })

        it('should return null and log error when no URL cached', async () => {
            serviceManager.getActiveApplicationUrl = sinon.stub().returns(null)

            const result = await handler.getActiveTransformProfileApplicationUrl()

            expect(result).to.be.null
            expect((logging.error as sinon.SinonStub).called).to.be.true
        })
    })

    describe('onProfileUpdate', () => {
        it('should null-out the cached atxClient', () => {
            ;(handler as any).atxClient = { send: () => null }
            handler.onProfileUpdate()
            expect((handler as any).atxClient).to.be.null
        })
    })

    describe('listWorkspaces', () => {
        it('should map workspace items to PascalCase response shape', async () => {
            sendStub.resolves({
                items: [
                    { id: 'ws-1', name: 'One', description: 'first' },
                    { id: 'ws-2', name: 'Two', description: 'second' },
                ],
            })

            const result = await handler.listWorkspaces()

            expect(result.workspaces).to.have.lengthOf(2)
            expect(result.workspaces[0]).to.include({ Id: 'ws-1', Name: 'One', Description: 'first' })
            expect(result.applicationUrl).to.equal('https://app.example.com')
        })

        it('should return empty workspaces and null URL on send error', async () => {
            sendStub.rejects(new Error('boom'))

            const result = await handler.listWorkspaces()

            expect(result.workspaces).to.deep.equal([])
            expect(result.applicationUrl).to.be.null
        })

        it('should handle missing items array gracefully', async () => {
            sendStub.resolves({
                /* no items */
            })

            const result = await handler.listWorkspaces()

            expect(result.workspaces).to.deep.equal([])
        })
    })

    describe('createWorkspace', () => {
        it('should return workspace info on success', async () => {
            sendStub.resolves({ workspace: { id: 'ws-9', name: 'New' } })

            const result = await handler.createWorkspace('New', 'desc')

            expect(result).to.deep.equal({ workspaceId: 'ws-9', workspaceName: 'New' })
        })

        it('should return null when response missing workspace fields', async () => {
            sendStub.resolves({ workspace: { id: 'ws-9' /* no name */ } })

            const result = await handler.createWorkspace('New')

            expect(result).to.be.null
        })

        it('should return null on send error', async () => {
            sendStub.rejects(new Error('boom'))

            const result = await handler.createWorkspace(null)

            expect(result).to.be.null
        })

        it('should auto-generate description when name is provided without description', async () => {
            sendStub.resolves({ workspace: { id: 'ws-9', name: 'New' } })

            await handler.createWorkspace('MyWorkspace')

            const command = sendStub.firstCall.args[0]
            expect(command.input.description).to.include('MyWorkspace')
        })
    })

    describe('listJobs', () => {
        it('should paginate and aggregate jobs from multiple pages', async () => {
            sendStub.onFirstCall().resolves({
                jobList: [{ jobInfo: { jobId: 'j1', statusDetails: { status: 'COMPLETED' } } }],
                nextToken: 'page-2',
            })
            sendStub.onSecondCall().resolves({
                jobList: [{ jobInfo: { jobId: 'j2', statusDetails: { status: 'EXECUTING' } } }],
                nextToken: undefined,
            })

            const result = await handler.listJobs('ws-1')

            expect(result?.Jobs).to.have.lengthOf(2)
            expect(result?.Jobs[0].JobId).to.equal('j1')
            expect(result?.Jobs[1].Status).to.equal('EXECUTING')
        })

        it('should return null on send error', async () => {
            sendStub.rejects(new Error('boom'))

            const result = await handler.listJobs('ws-1')

            expect(result).to.be.null
        })

        it('should default Status to UNKNOWN when missing in response', async () => {
            sendStub.resolves({
                jobList: [{ jobInfo: { jobId: 'j1' /* no statusDetails */ } }],
            })

            const result = await handler.listJobs('ws-1')

            expect(result?.Jobs[0].Status).to.equal('UNKNOWN')
        })
    })

    describe('listOrCreateWorkspace', () => {
        it('should return AvailableWorkspaces when CreateWorkspaceName not provided', async () => {
            sinon.stub(handler, 'listWorkspaces').resolves({
                workspaces: [{ Id: 'ws-1', Name: 'One' }],
                applicationUrl: 'u',
            })
            const createStub = sinon.stub(handler, 'createWorkspace')

            const result = await handler.listOrCreateWorkspace({} as any)

            expect(result?.AvailableWorkspaces).to.have.lengthOf(1)
            expect(result?.CreatedWorkspace).to.be.undefined
            expect(createStub.called).to.be.false
        })

        it('should create workspace and append it to AvailableWorkspaces when name is provided', async () => {
            sinon.stub(handler, 'listWorkspaces').resolves({
                workspaces: [],
                applicationUrl: 'u',
            })
            sinon.stub(handler, 'createWorkspace').resolves({
                workspaceId: 'ws-new',
                workspaceName: 'Brand New',
            })

            const result = await handler.listOrCreateWorkspace({
                CreateWorkspaceName: 'Brand New',
                CreateWorkspaceDescription: 'desc',
            } as any)

            expect(result?.CreatedWorkspace).to.deep.equal({
                WorkspaceId: 'ws-new',
                WorkspaceName: 'Brand New',
            })
            expect(result?.AvailableWorkspaces).to.have.lengthOf(1)
            expect(result?.AvailableWorkspaces[0].Id).to.equal('ws-new')
        })

        it('should return null when verifySession fails', async () => {
            sinon.stub(handler as any, 'verifySession').resolves(false)

            const result = await handler.listOrCreateWorkspace({} as any)

            expect(result).to.be.null
        })
    })

    describe('getJob', () => {
        it('should return the job from response on success', async () => {
            sendStub.resolves({ job: { statusDetails: { status: 'COMPLETED' } } })

            const result = await handler.getJob('ws-1', 'job-1')

            expect(result?.statusDetails?.status).to.equal('COMPLETED')
        })

        it('should return null when response has no job', async () => {
            sendStub.resolves({})

            const result = await handler.getJob('ws-1', 'job-1')

            expect(result).to.be.null
        })

        it('should return null on send error', async () => {
            sendStub.rejects(new Error('boom'))

            const result = await handler.getJob('ws-1', 'job-1')

            expect(result).to.be.null
        })
    })

    describe('createArtifactDownloadUrl', () => {
        it('should return s3PresignedUrl and normalized headers on success', async () => {
            sendStub.resolves({
                s3PreSignedUrl: 'https://s3/dl',
                requestHeaders: { 'x-foo': ['bar'], 'x-baz': 'qux' },
            })

            const result = await handler.createArtifactDownloadUrl('ws-1', 'job-1', 'art-1')

            expect(result?.s3PresignedUrl).to.equal('https://s3/dl')
            expect(result?.requestHeaders).to.deep.equal({ 'x-foo': 'bar', 'x-baz': 'qux' })
        })

        it('should return null when s3PreSignedUrl missing', async () => {
            sendStub.resolves({
                /* no s3PreSignedUrl */
            })

            const result = await handler.createArtifactDownloadUrl('ws-1', 'job-1', 'art-1')

            expect(result).to.be.null
        })

        it('should return null on send error', async () => {
            sendStub.rejects(new Error('boom'))

            const result = await handler.createArtifactDownloadUrl('ws-1', 'job-1', 'art-1')

            expect(result).to.be.null
        })
    })

    describe('listHitls', () => {
        it('should return hitlTasks array on success', async () => {
            sendStub.resolves({ hitlTasks: [{ taskId: 't1' }] })

            const result = await handler.listHitls('ws-1', 'job-1')

            expect(result).to.have.lengthOf(1)
            expect(result?.[0].taskId).to.equal('t1')
        })

        it('should return empty array when hitlTasks is missing', async () => {
            sendStub.resolves({})

            const result = await handler.listHitls('ws-1', 'job-1')

            expect(result).to.deep.equal([])
        })

        it('should return null on send error', async () => {
            sendStub.rejects(new Error('boom'))

            const result = await handler.listHitls('ws-1', 'job-1')

            expect(result).to.be.null
        })
    })

    describe('submitHitl & updateHitl & getHitl', () => {
        it('submitHitl should return result on success', async () => {
            sendStub.resolves({ status: 'SUBMITTED' })
            const result = await handler.submitHitl('ws-1', 'job-1', 't1', 'art-1')
            expect(result?.status).to.equal('SUBMITTED')
        })

        it('submitHitl should return null on send error', async () => {
            sendStub.rejects(new Error('boom'))
            expect(await handler.submitHitl('ws-1', 'job-1', 't1', 'art-1')).to.be.null
        })

        it('updateHitl should return result on success', async () => {
            sendStub.resolves({ status: 'UPDATED' })
            const result = await handler.updateHitl('ws-1', 'job-1', 't1', 'art-1')
            expect(result?.status).to.equal('UPDATED')
        })

        it('updateHitl should return null on send error', async () => {
            sendStub.rejects(new Error('boom'))
            expect(await handler.updateHitl('ws-1', 'job-1', 't1', 'art-1')).to.be.null
        })

        it('getHitl should return task object on success', async () => {
            sendStub.resolves({ task: { status: 'CLOSED' } })
            const result = await handler.getHitl('ws-1', 'job-1', 't1')
            expect(result?.status).to.equal('CLOSED')
        })

        it('getHitl should return null when no task in response', async () => {
            sendStub.resolves({})
            expect(await handler.getHitl('ws-1', 'job-1', 't1')).to.be.null
        })
    })

    describe('stopJob', () => {
        it('should return status on success and clear job cache', async () => {
            sendStub.resolves({ status: 'STOPPING' })
            ;(handler as any).cachedHitl = 'h1'

            const result = await handler.stopJob('ws-1', 'job-1')

            expect(result).to.equal('STOPPING')
            expect((handler as any).cachedHitl).to.be.null
        })

        it('should return "FAILED" on send error', async () => {
            sendStub.rejects(new Error('boom'))

            const result = await handler.stopJob('ws-1', 'job-1')

            expect(result).to.equal('FAILED')
        })

        it('should default to "STOPPED" when response status is missing', async () => {
            sendStub.resolves({
                /* no status */
            })

            const result = await handler.stopJob('ws-1', 'job-1')

            expect(result).to.equal('STOPPED')
        })
    })

    describe('downloadFinalArtifact', () => {
        it('should return null when no artifacts available', async () => {
            sinon.stub(handler as any, 'listArtifacts').resolves([])

            const result = await handler.downloadFinalArtifact('ws-1', 'job-1', 'C:/sln')

            expect(result).to.be.null
        })

        it('should return null when listArtifacts returns null', async () => {
            sinon.stub(handler as any, 'listArtifacts').resolves(null)

            const result = await handler.downloadFinalArtifact('ws-1', 'job-1', 'C:/sln')

            expect(result).to.be.null
        })

        it('should return null when createArtifactDownloadUrl fails', async () => {
            sinon.stub(handler as any, 'listArtifacts').resolves([{ artifactId: 'art-1' }])
            sinon.stub(handler, 'createArtifactDownloadUrl').resolves(null)

            const result = await handler.downloadFinalArtifact('ws-1', 'job-1', 'C:/sln')

            expect(result).to.be.null
        })

        it('should return download path on full happy flow', async () => {
            sinon.stub(handler as any, 'listArtifacts').resolves([{ artifactId: 'art-1' }])
            sinon.stub(handler, 'createArtifactDownloadUrl').resolves({
                s3PresignedUrl: 'https://s3/dl',
                requestHeaders: {},
            } as any)
            const utilsModule = require('../utils')
            sinon.stub(utilsModule.Utils, 'downloadAndExtractArchive').resolves(undefined)

            const result = await handler.downloadFinalArtifact('ws-1', 'job-1', 'C:/sln')

            expect(result).to.be.a('string')
            expect(result).to.include('job-1')
        })
    })

    describe('completeHitlWithBuildResults', () => {
        let tmpRoot: string

        beforeEach(() => {
            tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'atx-hitlbuild-'))
        })

        afterEach(() => {
            try {
                fs.rmSync(tmpRoot, { recursive: true, force: true })
            } catch {
                // best effort
            }
        })

        it('should return error when createArtifactUploadUrl fails', async () => {
            sinon.stub(handler, 'createArtifactUploadUrl').resolves(null)

            const result = await handler.completeHitlWithBuildResults('ws-1', 'job-1', 't1', 'BUILD OK', tmpRoot)

            expect(result.Success).to.be.false
            expect(result.Error).to.equal('Failed to create artifact upload URL')
        })

        it('should return error when uploadArtifact fails', async () => {
            sinon.stub(handler, 'createArtifactUploadUrl').resolves({
                uploadUrl: 'u',
                uploadId: 'upload-1',
                requestHeaders: {},
            } as any)
            const utilsModule = require('../utils')
            sinon.stub(utilsModule.Utils, 'uploadArtifact').resolves(false)

            const result = await handler.completeHitlWithBuildResults('ws-1', 'job-1', 't1', 'BUILD OK', tmpRoot)

            expect(result.Success).to.be.false
            expect(result.Error).to.equal('Failed to upload build results')
        })

        it('should return success on full happy path', async () => {
            sinon.stub(handler, 'createArtifactUploadUrl').resolves({
                uploadUrl: 'u',
                uploadId: 'upload-1',
                requestHeaders: {},
            } as any)
            const utilsModule = require('../utils')
            sinon.stub(utilsModule.Utils, 'uploadArtifact').resolves(true)
            sinon.stub(handler, 'completeArtifactUpload').resolves({ success: true })
            sinon.stub(handler, 'submitHitl').resolves({ status: 'SUBMITTED' } as any)

            const result = await handler.completeHitlWithBuildResults('ws-1', 'job-1', 't1', 'BUILD OK', tmpRoot)

            expect(result.Success).to.be.true
        })

        it('should return error when submitHitl returns null', async () => {
            sinon.stub(handler, 'createArtifactUploadUrl').resolves({
                uploadUrl: 'u',
                uploadId: 'upload-1',
                requestHeaders: {},
            } as any)
            const utilsModule = require('../utils')
            sinon.stub(utilsModule.Utils, 'uploadArtifact').resolves(true)
            sinon.stub(handler, 'completeArtifactUpload').resolves({ success: true })
            sinon.stub(handler, 'submitHitl').resolves(null)

            const result = await handler.completeHitlWithBuildResults('ws-1', 'job-1', 't1', 'BUILD OK', tmpRoot)

            expect(result.Success).to.be.false
            expect(result.Error).to.equal('Failed to submit HITL task')
        })
    })
})
