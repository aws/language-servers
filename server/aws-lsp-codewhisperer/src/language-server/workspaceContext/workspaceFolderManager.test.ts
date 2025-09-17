import { WorkspaceFolderManager } from './workspaceFolderManager'
import sinon, { stubInterface, StubbedInstance } from 'ts-sinon'
import { AmazonQTokenServiceManager } from '../../shared/amazonQServiceManager/AmazonQTokenServiceManager'
import { CredentialsProvider, Logging } from '@aws/language-server-runtimes/server-interface'
import { DependencyDiscoverer } from './dependency/dependencyDiscoverer'
import { WorkspaceFolder } from 'vscode-languageserver-protocol'
import { ArtifactManager } from './artifactManager'
import { CodeWhispererServiceToken } from '../../shared/codeWhispererService'
import { ListWorkspaceMetadataResponse, WorkspaceStatus } from '@amzn/codewhisperer-runtime'
import { IdleWorkspaceManager } from './IdleWorkspaceManager'
import { ServiceException } from '@smithy/smithy-client'

describe('WorkspaceFolderManager', () => {
    let mockServiceManager: StubbedInstance<AmazonQTokenServiceManager>
    let mockLogging: StubbedInstance<Logging>
    let mockCredentialsProvider: StubbedInstance<CredentialsProvider>
    let mockDependencyDiscoverer: StubbedInstance<DependencyDiscoverer>
    let mockArtifactManager: StubbedInstance<ArtifactManager>
    let mockCodeWhispererService: StubbedInstance<CodeWhispererServiceToken>
    let workspaceFolderManager: WorkspaceFolderManager

    beforeEach(() => {
        mockServiceManager = stubInterface<AmazonQTokenServiceManager>()
        mockLogging = stubInterface<Logging>()
        mockCredentialsProvider = stubInterface<CredentialsProvider>()
        mockDependencyDiscoverer = stubInterface<DependencyDiscoverer>()
        mockArtifactManager = stubInterface<ArtifactManager>()
        mockCodeWhispererService = stubInterface<CodeWhispererServiceToken>()

        mockServiceManager.getCodewhispererService.returns(mockCodeWhispererService)
    })

    afterEach(() => {
        sinon.restore()
    })

    describe('checkRemoteWorkspaceStatusAndReact', () => {
        it('should check and react when IDE session is not idle', async () => {
            // Setup
            const workspaceFolders: WorkspaceFolder[] = [
                {
                    uri: 'file:///test/workspace',
                    name: 'test-workspace',
                },
            ]

            // Mock IdleSessionManager to return false (not idle)
            sinon.stub(IdleWorkspaceManager, 'isSessionIdle').returns(false)

            // Mock successful response
            const mockResponse: ListWorkspaceMetadataResponse = {
                workspaces: [
                    {
                        workspaceId: 'test-workspace-id',
                        workspaceStatus: 'CREATED',
                    },
                ],
            }

            mockCodeWhispererService.listWorkspaceMetadata.resolves(mockResponse as any)

            // Create the WorkspaceFolderManager instance using the static createInstance method
            workspaceFolderManager = WorkspaceFolderManager.createInstance(
                mockServiceManager,
                mockLogging,
                mockArtifactManager,
                mockDependencyDiscoverer,
                workspaceFolders,
                mockCredentialsProvider,
                'test-workspace-identifier'
            )

            // Spy on resetWebSocketClient
            const resetWebSocketClientSpy = sinon.stub(workspaceFolderManager as any, 'resetWebSocketClient')

            // Spy on handleWorkspaceCreatedState
            const handleWorkspaceCreatedStateSpy = sinon.stub(
                workspaceFolderManager as any,
                'handleWorkspaceCreatedState'
            )

            // Act - trigger the checkRemoteWorkspaceStatusAndReact method
            await workspaceFolderManager.checkRemoteWorkspaceStatusAndReact()

            // Verify that resetWebSocketClient was called once
            sinon.assert.notCalled(resetWebSocketClientSpy)
            sinon.assert.calledOnce(handleWorkspaceCreatedStateSpy)
        })

        it('should skip checking and reacting when IDE session is idle', async () => {
            // Setup
            const workspaceFolders: WorkspaceFolder[] = [
                {
                    uri: 'file:///test/workspace',
                    name: 'test-workspace',
                },
            ]

            // Mock IdleSessionManager to return true (idle)
            sinon.stub(IdleWorkspaceManager, 'isSessionIdle').returns(true)

            // Mock successful response
            const mockResponse: ListWorkspaceMetadataResponse = {
                workspaces: [
                    {
                        workspaceId: 'test-workspace-id',
                        workspaceStatus: 'CREATED',
                    },
                ],
            }

            mockCodeWhispererService.listWorkspaceMetadata.resolves(mockResponse as any)

            // Create the WorkspaceFolderManager instance using the static createInstance method
            workspaceFolderManager = WorkspaceFolderManager.createInstance(
                mockServiceManager,
                mockLogging,
                mockArtifactManager,
                mockDependencyDiscoverer,
                workspaceFolders,
                mockCredentialsProvider,
                'test-workspace-identifier'
            )

            // Spy on resetWebSocketClient
            const resetWebSocketClientSpy = sinon.stub(workspaceFolderManager as any, 'resetWebSocketClient')

            // Act - trigger the checkRemoteWorkspaceStatusAndReact method
            await workspaceFolderManager.checkRemoteWorkspaceStatusAndReact()

            // Verify that resetWebSocketClient was called once
            sinon.assert.calledOnce(resetWebSocketClientSpy)
            sinon.assert.calledWith(
                mockLogging.log,
                sinon.match(/Session is idle, skipping remote workspace status check/)
            )
        })
    })

    describe('isFeatureDisabled', () => {
        it('should return true when feature is disabled', async () => {
            // Setup
            const workspaceFolders: WorkspaceFolder[] = [
                {
                    uri: 'file:///test/workspace',
                    name: 'test-workspace',
                },
            ]

            const mockError = new ServiceException({
                name: 'AccessDeniedException',
                message: 'Feature is not supported',
                $fault: 'client',
                $metadata: {
                    httpStatusCode: 403,
                },
            })

            mockCodeWhispererService.listWorkspaceMetadata.rejects(mockError)

            // Create the WorkspaceFolderManager instance
            workspaceFolderManager = WorkspaceFolderManager.createInstance(
                mockServiceManager,
                mockLogging,
                mockArtifactManager,
                mockDependencyDiscoverer,
                workspaceFolders,
                mockCredentialsProvider,
                'test-workspace-identifier'
            )

            // Spy on clearAllWorkspaceResources and related methods
            const clearAllWorkspaceResourcesSpy = sinon.stub(
                workspaceFolderManager as any,
                'clearAllWorkspaceResources'
            )

            // Act - trigger listWorkspaceMetadata which sets feature disabled state
            await (workspaceFolderManager as any).listWorkspaceMetadata()

            // Assert
            expect(workspaceFolderManager.isFeatureDisabled()).toBe(true)

            // Verify that clearAllWorkspaceResources was called
            sinon.assert.calledOnce(clearAllWorkspaceResourcesSpy)
        })

        it('should return false when feature is not disabled', async () => {
            // Setup
            const workspaceFolders: WorkspaceFolder[] = [
                {
                    uri: 'file:///test/workspace',
                    name: 'test-workspace',
                },
            ]

            // Mock successful response
            const mockResponse: ListWorkspaceMetadataResponse = {
                workspaces: [
                    {
                        workspaceId: 'test-workspace-id',
                        // TODO: RUNNING does not exist in WorkspaceStatus so we need to use type assertion for now.
                        workspaceStatus: 'RUNNING' as WorkspaceStatus,
                    },
                ],
            }

            mockCodeWhispererService.listWorkspaceMetadata.resolves(mockResponse as any)

            // Create the WorkspaceFolderManager instance
            workspaceFolderManager = WorkspaceFolderManager.createInstance(
                mockServiceManager,
                mockLogging,
                mockArtifactManager,
                mockDependencyDiscoverer,
                workspaceFolders,
                mockCredentialsProvider,
                'test-workspace-identifier'
            )

            // Act - trigger listWorkspaceMetadata
            await (workspaceFolderManager as any).listWorkspaceMetadata()

            // Assert
            expect(workspaceFolderManager.isFeatureDisabled()).toBe(false)
        })
    })
})
