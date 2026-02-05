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
    let planPath: string | null = null
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

    it('TEST 1: should list or create workspace', async () => {
        const result = await client.sendRequest('workspace/executeCommand', {
            command: 'aws/atxTransform/listOrCreateWorkspace',
            arguments: [],
        })

        workspaceId = result?.CreatedWorkspace?.Id || result?.AvailableWorkspaces?.[0]?.Id
        expect(workspaceId).to.exist
        console.log('WorkspaceId:', workspaceId)
    })

    it('TEST 2: should start transform job', async () => {
        const sourceFiles = getSourceFiles(testFixturePath)
        console.log(`Found ${sourceFiles.length} source files`)

        const result = await client.sendRequest(
            'workspace/executeCommand',
            buildStartTransformRequest('IntegTest-BobsBookstore-' + Date.now(), sourceFiles)
        )

        transformationJobId = result?.TransformationJobId
        expect(transformationJobId).to.exist
        console.log('TransformationJobId:', transformationJobId)
    })

    it('TEST 3: should poll transform until AWAITING_HUMAN_INPUT', async function (this: Mocha.Context) {
        this.timeout(3600000)
        const maxPolls = 360
        let jobStatus = ''

        for (let i = 0; i < maxPolls; i++) {
            const result = await client.sendRequest('workspace/executeCommand', {
                command: 'aws/atxTransform/getTransformInfo',
                TransformationJobId: transformationJobId,
                WorkspaceId: workspaceId,
                SolutionRootPath: testFixturePath,
            })

            const job = result?.TransformationJob || {}
            jobStatus = job.Status || ''
            planPath = result?.PlanPath || null
            console.log(`Poll ${i + 1}: Status = ${jobStatus}`)

            if (jobStatus === 'FAILED') {
                const reason = job.FailureReason || result?.ErrorString || 'unknown'
                console.log('FAILED - Reason:', reason)
                throw new Error(`Job failed: ${reason}`)
            }

            if (jobStatus === 'AWAITING_HUMAN_INPUT' && planPath) break
            if (['COMPLETED', 'FAILED', 'STOPPED'].includes(jobStatus)) break

            await sleep(10000)
        }

        expect(jobStatus).to.equal('AWAITING_HUMAN_INPUT')
        expect(planPath).to.exist
    })

    it('TEST 4: should upload plan and complete transform', async function (this: Mocha.Context) {
        this.timeout(10800000)
        if (!planPath) {
            this.skip()
            return
        }

        const uploadResult = await client.sendRequest('workspace/executeCommand', {
            command: 'aws/atxTransform/uploadPlan',
            TransformationJobId: transformationJobId,
            WorkspaceId: workspaceId,
            PlanPath: planPath,
        })
        console.log('UploadPlan result:', uploadResult?.VerificationStatus)

        const maxPolls = 1080
        let jobStatus = ''

        for (let i = 0; i < maxPolls; i++) {
            const result = await client.sendRequest('workspace/executeCommand', {
                command: 'aws/atxTransform/getTransformInfo',
                TransformationJobId: transformationJobId,
                WorkspaceId: workspaceId,
                SolutionRootPath: testFixturePath,
            })

            jobStatus = result?.TransformationJob?.Status || ''
            console.log(`Poll ${i + 1}: Status = ${jobStatus}`)

            if (['COMPLETED', 'FAILED', 'STOPPED', 'PARTIALLY_COMPLETED'].includes(jobStatus)) break

            await sleep(10000)
        }

        expect(['COMPLETED', 'PARTIALLY_COMPLETED']).to.include(jobStatus)
    })

    it('TEST 5: should stop a transform job', async function (this: Mocha.Context) {
        this.timeout(60000)
        const sourceFiles = getSourceFiles(testFixturePath)

        const startResult = await client.sendRequest(
            'workspace/executeCommand',
            buildStartTransformRequest('IntegTest-ToStop-' + Date.now(), sourceFiles)
        )

        const jobToStop = startResult?.TransformationJobId
        expect(jobToStop).to.exist
        console.log('Created job to stop:', jobToStop)

        await sleep(5000)

        const stopResult = await client.sendRequest('workspace/executeCommand', {
            command: 'aws/atxTransform/stopJob',
            WorkspaceId: workspaceId,
            JobId: jobToStop,
        })

        console.log('StopJob result:', stopResult?.Status)
        expect(stopResult).to.exist
    })
})
