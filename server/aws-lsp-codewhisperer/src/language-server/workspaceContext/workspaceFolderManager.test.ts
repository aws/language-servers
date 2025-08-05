import { WorkspaceFolderManager } from './workspaceFolderManager'
import sinon, { stubInterface, StubbedInstance } from 'ts-sinon'
import { CredentialsProvider, Logging } from '@aws/language-server-runtimes/server-interface'
import { DependencyDiscoverer } from './dependency/dependencyDiscoverer'
import { WorkspaceFolder } from 'vscode-languageserver-protocol'
import { ArtifactManager } from './artifactManager'
import { CodeWhispererServiceToken } from '../../shared/codeWhispererService/codeWhispererServiceToken'
import { CreateWorkspaceResponse } from '../../client/token/codewhispererbearertokenclient'
import { AWSError } from 'aws-sdk'
import { AmazonQServiceManager } from '../../shared/amazonQServiceManager/AmazonQServiceManager'

describe('WorkspaceFolderManager', () => {
    let mockServiceManager: StubbedInstance<AmazonQServiceManager>
    let mockLogging: StubbedInstance<Logging>
    let mockCredentialsProvider: StubbedInstance<CredentialsProvider>
    let mockDependencyDiscoverer: StubbedInstance<DependencyDiscoverer>
    let mockArtifactManager: StubbedInstance<ArtifactManager>
    let mockCodeWhispererService: StubbedInstance<CodeWhispererServiceToken>
    let workspaceFolderManager: WorkspaceFolderManager

    beforeEach(() => {
        mockServiceManager = stubInterface<AmazonQServiceManager>()
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

    describe('getServiceQuotaExceededStatus', () => {
        it('should return true when service quota is exceeded', async () => {
            // Setup
            const workspaceFolders: WorkspaceFolder[] = [
                {
                    uri: 'file:///test/workspace',
                    name: 'test-workspace',
                },
            ]

            // Mock the createWorkspace method to throw a ServiceQuotaExceededException
            const mockError: AWSError = {
                name: 'ServiceQuotaExceededException',
                message: 'You have too many active running workspaces.',
                code: 'ServiceQuotaExceededException',
                time: new Date(),
                retryable: false,
                statusCode: 400,
            }

            mockCodeWhispererService.createWorkspace.rejects(mockError)

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

            // Spy on clearAllWorkspaceResources and related methods
            const clearAllWorkspaceResourcesSpy = sinon.stub(
                workspaceFolderManager as any,
                'clearAllWorkspaceResources'
            )

            // Act - trigger the createNewWorkspace method which sets isServiceQuotaExceeded
            await (workspaceFolderManager as any).createNewWorkspace()

            // Assert
            expect(workspaceFolderManager.getServiceQuotaExceededStatus()).toBe(true)

            // Verify that clearAllWorkspaceResources was called
            sinon.assert.calledOnce(clearAllWorkspaceResourcesSpy)
        })

        it('should return false when service quota is not exceeded', async () => {
            // Setup
            const workspaceFolders: WorkspaceFolder[] = [
                {
                    uri: 'file:///test/workspace',
                    name: 'test-workspace',
                },
            ]

            // Mock successful response
            const mockResponse: CreateWorkspaceResponse = {
                workspace: {
                    workspaceId: 'test-workspace-id',
                    workspaceStatus: 'RUNNING',
                },
            }

            mockCodeWhispererService.createWorkspace.resolves(mockResponse as any)

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

            // Spy on clearAllWorkspaceResources
            const clearAllWorkspaceResourcesSpy = sinon.stub(
                workspaceFolderManager as any,
                'clearAllWorkspaceResources'
            )

            // Act - trigger the createNewWorkspace method
            await (workspaceFolderManager as any).createNewWorkspace()

            // Assert
            expect(workspaceFolderManager.getServiceQuotaExceededStatus()).toBe(false)

            // Verify that clearAllWorkspaceResources was not called
            sinon.assert.notCalled(clearAllWorkspaceResourcesSpy)
        })
    })
})
