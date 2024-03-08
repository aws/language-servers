import { Server } from '@aws/language-server-runtimes'
import { CredentialsProvider } from '@aws/language-server-runtimes/out/features'
import { SecurityScanRequestParams } from '@aws/language-server-runtimes/out/features/securityScan/securityScan'
import { pathToFileURL } from 'url'
import { CancellationToken, ExecuteCommandParams } from 'vscode-languageserver'
import { ArtifactMap } from '../client/token/codewhispererbearertokenclient'
import { CodeWhispererServiceToken } from './codeWhispererService'
import { DependencyGraphFactory } from './dependencyGraph/dependencyGraphFactory'
import { SecurityScanHandler } from './securityScan/securityScanHandler'
import { SecurityScanResponseParams } from './securityScan/types'
import { parseJson } from './utils'

export const SecurityScanServerToken =
    (service: (credentialsProvider: CredentialsProvider) => CodeWhispererServiceToken): Server =>
    ({ credentialsProvider, workspace, logging, lsp }) => {
        const codewhispererclient = service(credentialsProvider)
        let jobStatus: string
        const runSecurityScan = async (params: SecurityScanRequestParams) => {
            logging.log(`Starting security scan`)
            try {
                if (!credentialsProvider.hasCredentials('bearer')) {
                    throw new Error('credentialsrProvider does not have bearer token credentials')
                }
                if (!params.arguments || params.arguments.length === 0) {
                    throw new Error(`Incorrect params provided. Params: ${params}`)
                }
                const [arg] = params.arguments
                const { activeFilePath, projectPath } = parseJson(arg)

                if (!activeFilePath || !projectPath) {
                    throw new Error(`Error: file path or project path not provided. Params: ${params}`)
                }
                const activeFilePathUri = pathToFileURL(activeFilePath).href
                const document = await workspace.getTextDocument(activeFilePathUri)
                if (!document) {
                    throw new Error('Text document for given activeFilePath is undefined.')
                }
                /**
                 * Step 1: Generate context truncations
                 */
                const dependencyGraph = DependencyGraphFactory.getDependencyGraph(
                    document,
                    workspace,
                    logging,
                    projectPath
                )
                if (dependencyGraph === undefined) {
                    throw new Error(`"${document.languageId}" is not supported for security scan.`)
                }
                if (dependencyGraph.exceedsSizeLimit((await workspace.fs.getFileSize(activeFilePath)).size)) {
                    throw new Error(
                        `Selected file larger than ${dependencyGraph.getReadableSizeLimit()}. Try a different file.`
                    )
                }
                const truncation = await dependencyGraph.generateTruncation(activeFilePath)
                const scanHandler = new SecurityScanHandler(codewhispererclient, workspace, logging)
                logging.log(`Complete project context processing.`)

                /**
                 * Step 2: Get presigned Url, upload and clean up
                 */
                let artifactMap: ArtifactMap = {}
                try {
                    artifactMap = await scanHandler.createCodeResourcePresignedUrlHandler(truncation.zipFileBuffer)
                } catch (error) {
                    logging.log(`Error: Failed to upload code artifacts ${error}`)
                    throw error
                } finally {
                    await dependencyGraph.removeTmpFiles()
                }
                /**
                 * Step 3:  Create scan job
                 */
                const scanJob = await scanHandler.createScanJob(artifactMap, document.languageId.toLowerCase())
                logging.log(`Created security scan job.`)

                /**
                 * Step 4:  Polling mechanism on scan job status
                 */
                jobStatus = await scanHandler.pollScanJobStatus(scanJob.jobId)
                if (jobStatus === 'Failed') {
                    throw new Error('security scan job failed.')
                }

                /**
                 * Step 5: Process and render scan results
                 */
                logging.log(`Security scan job succeeded and start processing result.`)
                const securityRecommendationCollection = await scanHandler.listScanResults(scanJob.jobId, projectPath)
                const { total, withFixes } = securityRecommendationCollection.reduce(
                    (accumulator, current) => ({
                        total: accumulator.total + current.issues.length,
                        withFixes:
                            accumulator.withFixes + current.issues.filter(i => i.suggestedFixes.length > 0).length,
                    }),
                    { total: 0, withFixes: 0 }
                )
                logging.log(`Security scan totally found ${total} issues. ${withFixes} of them have fixes.`)

                /**
                 * Step 6: send results to diagnostics
                 */
                // Todo: update diagnostics to add securityRecommendationCollection

                logging.log(`Security scan completed.`)
                return {
                    result: {
                        status: jobStatus,
                    },
                } as SecurityScanResponseParams
            } catch (error) {
                logging.log(`Security scan failed. ${error}`)
                // Todo: notify client about scan job failure.
                return {
                    result: {
                        status: 'Failed',
                    },
                    error,
                } as SecurityScanResponseParams
            }
        }
        const onExecuteCommandHandler = async (
            params: ExecuteCommandParams,
            _token: CancellationToken
        ): Promise<any> => {
            switch (params.command) {
                case 'aws/codewhisperer/runSecurityScan':
                    return runSecurityScan(params as SecurityScanRequestParams)
                case 'aws/codewhisperer/cancelSecurityScan':
                // Todo: cancel command
            }
            return
        }
        lsp.onExecuteCommand(onExecuteCommandHandler)
        logging.log('SecurityScan server has been initialized')

        return () => {
            // dispose function
        }
    }
