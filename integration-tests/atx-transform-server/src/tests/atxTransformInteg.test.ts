import { expect } from 'chai'
import * as path from 'path'
import * as fs from 'fs'
import { LspClient } from './lspClient'
import { execSync } from 'child_process'

function getSourceFiles(
    dir: string,
    extensions: string[] = ['.cs', '.csproj', '.sln', '.config', '.json', '.cshtml', '.razor']
): string[] {
    const files: string[] = []
    const excluded = ['.git', 'bin', 'obj', 'node_modules', '.vs', '.idea']

    function walk(currentDir: string) {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true })
        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name)
            if (entry.isDirectory()) {
                if (!excluded.includes(entry.name)) walk(fullPath)
            } else if (extensions.some(ext => entry.name.endsWith(ext))) {
                files.push(fullPath)
            }
        }
    }
    walk(dir)
    return files
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function refreshTokenFromSecretsManager(): string {
    const result = execSync(
        'aws secretsmanager get-secret-value --secret-id AtxSsoTokenSecret --query SecretString --output text',
        { encoding: 'utf-8' }
    )
    const secret = JSON.parse(result)
    return secret.bearerToken.replace('Bearer ', '')
}

describe('ATX .NET Transform Integration Tests', () => {
    let client: LspClient
    let workspaceId: string
    let transformationJobId: string
    let refreshInterval: NodeJS.Timeout

    let testSsoToken = process.env.TEST_SSO_TOKEN || ''
    const runtimeFile = process.env.TEST_RUNTIME_FILE || ''
    const startUrl = process.env.TEST_SSO_START_URL || ''
    const testFixturePath = path.resolve(__dirname, 'testFixture', 'bobs-used-bookstore-classic')
    const solutionFilePath = path.join(testFixturePath, 'BobsBookstoreClassic.sln')
    const webProjectPath = path.join(testFixturePath, 'app', 'Bookstore.Web', 'Bookstore.Web.csproj')
    const commonProjectPath = path.join(testFixturePath, 'app', 'Bookstore.Common', 'Bookstore.Common.csproj')
    const dataProjectPath = path.join(testFixturePath, 'app', 'Bookstore.Data', 'Bookstore.Data.csproj')
    const domainProjectPath = path.join(testFixturePath, 'app', 'Bookstore.Domain', 'Bookstore.Domain.csproj')

    const TOKEN_REFRESH_INTERVAL_MS = 25 * 60 * 1000
    const TERMINAL_STATUSES = ['COMPLETED', 'PARTIALLY_COMPLETED', 'FAILED', 'STOPPED']

    async function refreshToken(): Promise<void> {
        try {
            console.log('[Token Refresh] Refreshing SSO token...')
            testSsoToken = refreshTokenFromSecretsManager()
            await client.sendRequest('aws/credentials/token/update', {
                data: { token: testSsoToken },
                credentialkey: 'atx-bearer',
                metadata: { sso: { startUrl } },
            })
            console.log('[Token Refresh] Token updated successfully')
        } catch (error) {
            console.error('[Token Refresh] Failed:', error)
        }
    }

    function buildStartTransformRequest(jobName: string, sourceFiles: string[]) {
        return {
            command: 'aws/atxTransform/startTransform',
            WorkspaceId: workspaceId,
            JobName: jobName,
            useOrchestratorAgent: true,
            StartTransformRequest: {
                SolutionRootPath: testFixturePath,
                SolutionFilePath: solutionFilePath,
                SelectedProjectPath: webProjectPath,
                ProgramLanguage: 'csharp',
                TargetFramework: 'net8.0',
                SolutionConfigPaths: [],
                ProjectMetadata: [
                    {
                        Name: 'Bookstore.Web',
                        ProjectPath: webProjectPath,
                        ProjectTargetFramework: 'net48',
                        ProjectLanguage: 'csharp',
                        ProjectType: 'Web',
                        SourceCodeFilePaths: sourceFiles,
                        ExternalReferences: [],
                    },
                    {
                        Name: 'Bookstore.Common',
                        ProjectPath: commonProjectPath,
                        ProjectTargetFramework: 'net48',
                        ProjectLanguage: 'csharp',
                        ProjectType: 'Library',
                        SourceCodeFilePaths: sourceFiles,
                        ExternalReferences: [],
                    },
                    {
                        Name: 'Bookstore.Data',
                        ProjectPath: dataProjectPath,
                        ProjectTargetFramework: 'net48',
                        ProjectLanguage: 'csharp',
                        ProjectType: 'Library',
                        SourceCodeFilePaths: sourceFiles,
                        ExternalReferences: [],
                    },
                    {
                        Name: 'Bookstore.Domain',
                        ProjectPath: domainProjectPath,
                        ProjectTargetFramework: 'net48',
                        ProjectLanguage: 'csharp',
                        ProjectType: 'Library',
                        SourceCodeFilePaths: sourceFiles,
                        ExternalReferences: [],
                    },
                ],
                TransformNetStandardProjects: false,
                EnableRazorViewTransform: true,
                EnableWebFormsTransform: false,
            },
        }
    }

    before(async () => {
        if (!testSsoToken) throw new Error('TEST_SSO_TOKEN not set')
        if (!runtimeFile) throw new Error('TEST_RUNTIME_FILE not set')
        if (!startUrl) throw new Error('TEST_SSO_START_URL not set')

        client = new LspClient(runtimeFile)
        await client.initialize()
        await sleep(2000)

        client.sendNotification('initialized', {})
        await sleep(1000)

        await client.sendRequest('aws/credentials/token/update', {
            data: { token: testSsoToken },
            credentialkey: 'atx-bearer',
            metadata: { sso: { startUrl } },
        })
        await sleep(5000)

        const profiles = await client.sendRequest('aws/getConfigurationFromServer', {
            section: 'aws.transformProfiles',
        })
        await sleep(5000)

        const iadProfile = profiles?.find((p: any) => p.identityDetails?.region === 'us-east-1')
        if (!iadProfile) throw new Error('No us-east-1 profile found')
        console.log('Found IAD profile:', iadProfile.arn)

        await client.sendRequest('aws/updateConfiguration', {
            section: 'aws.atx',
            settings: { profileArn: iadProfile.arn, applicationUrl: iadProfile.applicationUrl },
        })
        await sleep(3000)
        refreshInterval = setInterval(() => refreshToken(), TOKEN_REFRESH_INTERVAL_MS)
    })

    after(() => {
        if (refreshInterval) clearInterval(refreshInterval)
        if (client) client.close()
    })

    // TEST 1: Validates listOrCreateWorkspace — exercises ListWorkspaces + CreateWorkspace FES calls
    it('TEST 1: should list or create workspace', async () => {
        console.log('TEST 1: calling listOrCreateWorkspace')
        const result = await client.sendRequest('workspace/executeCommand', {
            command: 'aws/atxTransform/listOrCreateWorkspace',
            arguments: [],
        })

        console.log('TEST 1: raw result:', JSON.stringify(result))
        workspaceId = result?.CreatedWorkspace?.Id || result?.AvailableWorkspaces?.[0]?.Id
        expect(workspaceId, 'workspaceId should exist in listOrCreateWorkspace response').to.exist
        console.log('TEST 1: WorkspaceId:', workspaceId)
    })

    // TEST 2: Validates startTransform — exercises CreateJob, CreateArtifactUploadUrl,
    //         CompleteArtifactUpload, StartJob FES calls
    it('TEST 2: should start transform job', async () => {
        const sourceFiles = getSourceFiles(testFixturePath)
        console.log(`TEST 2: Found ${sourceFiles.length} source files`)

        const jobName = 'IntegTest-BobsBookstore-' + Date.now()
        console.log('TEST 2: Starting transform job:', jobName)

        const result = await client.sendRequest(
            'workspace/executeCommand',
            buildStartTransformRequest(jobName, sourceFiles)
        )

        console.log('TEST 2: raw result:', JSON.stringify(result))
        transformationJobId = result?.TransformationJobId
        expect(transformationJobId, 'TransformationJobId should exist in startTransform response').to.exist
        console.log('TEST 2: TransformationJobId:', transformationJobId)

        // Send initial message to trigger the backend orchestrator
        // The backend agent container needs ~30s to fully initialize before it can receive messages
        await sleep(30000)
        console.log('TEST 2: Sending init message to trigger orchestrator')
        const msgResult = await client.sendRequest('workspace/executeCommand', {
            command: 'aws/atxTransform/sendMessage',
            workspaceId: workspaceId,
            jobId: transformationJobId,
            text: 'I have uploaded the code, please start the assessment',
            skipPolling: true,
        })
        console.log('TEST 2: sendMessage result:', JSON.stringify(msgResult))
    })

    // TEST 3: Validates polling through PLANNING phase — exercises GetJob, ListWorklogs,
    //         ListJobPlanSteps, ListHitlTasks FES calls. Polls until EXECUTING begins.
    it('TEST 3: should poll transform until EXECUTING', async function (this: Mocha.Context) {
        this.timeout(7200000) // 2 hours — planning phase with Claude Opus can take 60-90 mins
        const maxPolls = 720  // 720 x 10s = 2 hours
        let jobStatus = ''

        for (let i = 0; i < maxPolls; i++) {
            const pollStart = Date.now()
            const result = await client.sendRequest('workspace/executeCommand', {
                command: 'aws/atxTransform/getTransformInfo',
                TransformationJobId: transformationJobId,
                WorkspaceId: workspaceId,
                useOrchestratorAgent: true,
            })
            const pollMs = Date.now() - pollStart

            if (result === null || result === undefined) {
                console.error(`TEST 3 Poll ${i + 1}: getTransformInfo returned null/undefined (${pollMs}ms)`)
                await sleep(10000)
                continue
            }

            const job = result?.TransformationJob || {}
            jobStatus = job.Status || ''
            const errorString = result?.ErrorString || null
            const hitlTag = result?.HitlTag || null
            const stepCount = result?.TransformationPlan?.Root?.Children?.length ?? 0
            console.log(`TEST 3 Poll ${i + 1}: Status=${jobStatus} Steps=${stepCount} HitlTag=${hitlTag} ErrorString=${errorString} (${pollMs}ms)`)

            if (jobStatus === 'FAILED') {
                const reason = job.FailureReason || result?.ErrorString || 'unknown'
                console.error('TEST 3: Job FAILED - Reason:', reason)
                throw new Error(`Job failed during planning: ${reason}`)
            }

            if (jobStatus === 'EXECUTING') {
                console.log('TEST 3: Reached EXECUTING — planning phase complete')
                break
            }

            if (TERMINAL_STATUSES.includes(jobStatus)) {
                console.log('TEST 3: Reached terminal status:', jobStatus)
                break
            }

            await sleep(10000)
        }

        expect(
            ['EXECUTING', 'COMPLETED', 'PARTIALLY_COMPLETED'],
            `Expected job to reach EXECUTING but got: ${jobStatus}`
        ).to.include(jobStatus)
    })

    // TEST 4: Validates polling through EXECUTING → COMPLETED — exercises GetJob,
    //         ListJobPlanSteps, ListWorklogs, ListHitlTasks (HITL probe),
    //         CreateArtifactDownloadUrl + S3 download (checkpoint artifacts),
    //         ListArtifacts + CreateArtifactDownloadUrl (final artifact) FES calls
    it('TEST 4: should poll transform until COMPLETED', async function (this: Mocha.Context) {
        this.timeout(10800000) // 3 hours — execution phase
        const maxPolls = 1080  // 1080 x 10s = 3 hours
        let jobStatus = ''
        let lastLoggedStatus = ''
        let artifactPath: string | null = null

        // If TEST 3 already reached COMPLETED/PARTIALLY_COMPLETED, skip polling
        const checkResult = await client.sendRequest('workspace/executeCommand', {
            command: 'aws/atxTransform/getTransformInfo',
            TransformationJobId: transformationJobId,
            WorkspaceId: workspaceId,
            useOrchestratorAgent: true,
        })
        jobStatus = checkResult?.TransformationJob?.Status || ''
        if (['COMPLETED', 'PARTIALLY_COMPLETED'].includes(jobStatus)) {
            artifactPath = checkResult?.ArtifactPath || null
            console.log(`TEST 4: Already at terminal status ${jobStatus}, ArtifactPath: ${artifactPath}`)
        }

        if (!TERMINAL_STATUSES.includes(jobStatus)) {
            for (let i = 0; i < maxPolls; i++) {
                const pollStart = Date.now()
                const result = await client.sendRequest('workspace/executeCommand', {
                    command: 'aws/atxTransform/getTransformInfo',
                    TransformationJobId: transformationJobId,
                    WorkspaceId: workspaceId,
                    useOrchestratorAgent: true,
                })
                const pollMs = Date.now() - pollStart

                if (result === null || result === undefined) {
                    console.error(`TEST 4 Poll ${i + 1}: getTransformInfo returned null/undefined (${pollMs}ms)`)
                    await sleep(10000)
                    continue
                }

                jobStatus = result?.TransformationJob?.Status || ''
                const hitlTag = result?.HitlTag || null
                const hitlTaskId = result?.HitlTaskId || null
                const errorString = result?.ErrorString || null
                const diffApplyFailed = result?.DiffApplyFailed || false
                const stepCount = result?.TransformationPlan?.Root?.Children?.length ?? 0
                artifactPath = result?.ArtifactPath || null
                if (hitlTag || jobStatus !== lastLoggedStatus || i % 10 === 0) {
                    console.log(`TEST 4 Poll ${i + 1}: Status=${jobStatus} Steps=${stepCount} HitlTag=${hitlTag} DiffApplyFailed=${diffApplyFailed} ErrorString=${errorString} ArtifactPath=${artifactPath} (${pollMs}ms)`)
                    lastLoggedStatus = jobStatus
                }

                // Handle local-build-verification HITL — respond with fake successful build
                if (hitlTag === 'local-build-verification' && hitlTaskId) {
                    console.log(`TEST 4: Responding to local-build-verification HITL taskId=${hitlTaskId}`)
                    const buildResult = JSON.stringify({
                        status: 'SUCCESS',
                        errorCount: 0,
                        errors: [],
                        warningCount: 0,
                        timedOut: false,
                        startedAt: new Date().toISOString(),
                        finishedAt: new Date().toISOString(),
                        durationSeconds: 1,
                    })
                    const hitlResult = await client.sendRequest('workspace/executeCommand', {
                        command: 'aws/atxTransform/completeLocalBuildHitl',
                        WorkspaceId: workspaceId,
                        TransformationJobId: transformationJobId,
                        TaskId: hitlTaskId,
                        BuildResultJson: buildResult,
                        SolutionRootPath: testFixturePath,
                    })
                    console.log('TEST 4: completeLocalBuildHitl result:', JSON.stringify(hitlResult))

                    // After LBV is done, send "Mark this job as complete" to trigger COMPLETED
                    await sleep(10000)
                    console.log('TEST 4: Sending mark-complete message')
                    await client.sendRequest('workspace/executeCommand', {
                        command: 'aws/atxTransform/sendMessage',
                        workspaceId: workspaceId,
                        jobId: transformationJobId,
                        text: 'Mark this job as complete',
                        skipPolling: true,
                    })
                    console.log('TEST 4: Mark-complete message sent')
                }

                if (jobStatus === 'FAILED') {
                    const reason = result?.TransformationJob?.FailureReason || result?.ErrorString || 'unknown'
                    console.error('TEST 4: Job FAILED - Reason:', reason)
                }

                if (TERMINAL_STATUSES.includes(jobStatus)) break

                await sleep(10000)
            }
        }

        console.log('TEST 4: Final status:', jobStatus, 'ArtifactPath:', artifactPath)
        expect(
            ['COMPLETED', 'PARTIALLY_COMPLETED'],
            `Expected COMPLETED or PARTIALLY_COMPLETED but got: ${jobStatus}`
        ).to.include(jobStatus)
        // ArtifactPath is only returned when SolutionRootPath is provided (downloads final artifact to disk).
        // We omit SolutionRootPath from polls to avoid fetchWorklogs log flooding, so ArtifactPath is null.
    })

    // TEST 5: Validates stopJob — exercises CreateJob, StartJob, StopJob FES calls
    it('TEST 5: should stop a transform job', async function (this: Mocha.Context) {
        this.timeout(120000)
        const sourceFiles = getSourceFiles(testFixturePath)

        const jobName = 'IntegTest-ToStop-' + Date.now()
        console.log('TEST 5: Starting job to stop:', jobName)
        const startResult = await client.sendRequest(
            'workspace/executeCommand',
            buildStartTransformRequest(jobName, sourceFiles)
        )

        const jobToStop = startResult?.TransformationJobId
        expect(jobToStop, 'TransformationJobId should exist for job-to-stop').to.exist
        console.log('TEST 5: Created job to stop:', jobToStop)

        await sleep(5000)

        const stopResult = await client.sendRequest('workspace/executeCommand', {
            command: 'aws/atxTransform/stopJob',
            WorkspaceId: workspaceId,
            JobId: jobToStop,
        })

        console.log('TEST 5: StopJob raw result:', JSON.stringify(stopResult))
        expect(stopResult, 'stopJob should return a result').to.exist
        expect(stopResult?.Status, 'StopJob status should be STOPPING or STOPPED').to.be.oneOf(['STOPPING', 'STOPPED'])
    })
})
